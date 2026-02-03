import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "resend";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface OrderItem {
  product: {
    name: string;
    unit: string;
  };
  quantity: number;
}

interface SendOrderRequest {
  orderId: string;
  sendCopyToUser?: boolean;
  userEmail?: string;
}

const UNIT_FULL_NAMES: Record<string, string> = {
  'κιβ': 'κιβώτια',
  'τεμ': 'τεμάχια',
  'παλ': 'παλέτες',
  'kg': 'κιλά',
};

const UNIT_SINGULAR: Record<string, string> = {
  'κιβ': 'κιβώτιο',
  'τεμ': 'τεμάχιο',
  'παλ': 'παλέτα',
  'kg': 'κιλό',
};

function getFullUnitName(unit: string, quantity: number): string {
  if (quantity === 1) {
    return UNIT_SINGULAR[unit] || unit;
  }
  return UNIT_FULL_NAMES[unit] || unit;
}

function formatDate(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return now.toLocaleDateString('el-GR', options);
}

function generateEmailHtml(supplierName: string, items: OrderItem[]): string {
  const itemsTable = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.product.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${getFullUnitName(item.product.unit, item.quantity)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="el">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Παραγγελία Αποθήκης</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Προς: ${supplierName}</p>
      </div>
      
      <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="margin-top: 0;">Γεια σας,</p>
        
        <p>Θα θέλαμε να παραγγείλουμε τα παρακάτω προϊόντα:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f9fafb; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #e5e7eb;">
              <th style="padding: 12px; text-align: left; font-weight: 600;">Προϊόν</th>
              <th style="padding: 12px; text-align: right; font-weight: 600;">Ποσότητα</th>
              <th style="padding: 12px; text-align: left; font-weight: 600;">Μονάδα</th>
            </tr>
          </thead>
          <tbody>
            ${itemsTable}
          </tbody>
        </table>
        
        <p>Παρακαλούμε επιβεβαιώστε την παραλαβή και ενημερώστε μας για τυχόν ελλείψεις.</p>
        
        <p style="margin-bottom: 0;">Ευχαριστούμε,<br><strong>Αποθήκη</strong></p>
      </div>
      
      <div style="background: #f3f4f6; padding: 16px 24px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="margin: 0; font-size: 12px; color: #6b7280;">
          Ημερομηνία: ${formatDate()}
        </p>
      </div>
    </body>
    </html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase configuration is missing");
    }

    const resend = new Resend(resendApiKey);
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { orderId, sendCopyToUser, userEmail }: SendOrderRequest = await req.json();

    if (!orderId) {
      throw new Error("Order ID is required");
    }

    // Fetch order with supplier and items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        supplier:suppliers(*),
        items:order_items(
          *,
          product:products(*)
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    const supplierEmail = order.supplier.email;
    const supplierName = order.supplier.name;

    if (!supplierEmail) {
      throw new Error("Ο προμηθευτής δεν έχει email");
    }

    const emailHtml = generateEmailHtml(supplierName, order.items);
    const subject = `Παραγγελία - ${supplierName}`;

    // Send to supplier
    const supplierEmailResponse = await resend.emails.send({
      from: "Αποθήκη <onboarding@resend.dev>",
      to: [supplierEmail],
      subject: subject,
      html: emailHtml,
    });

    console.log("Email sent to supplier:", supplierEmailResponse);

    // Send copy to user if requested
    if (sendCopyToUser && userEmail) {
      const userEmailResponse = await resend.emails.send({
        from: "Αποθήκη <onboarding@resend.dev>",
        to: [userEmail],
        subject: `[Αντίγραφο] ${subject}`,
        html: emailHtml,
      });
      console.log("Copy sent to user:", userEmailResponse);
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (updateError) {
      console.error("Failed to update order status:", updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully",
        supplierEmail 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-order-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
