import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || process.env.EMAILJS_SERVICE_ID;
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || process.env.EMAILJS_TEMPLATE_ID;
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || process.env.EMAILJS_PUBLIC_KEY;
    const privateKey = process.env.EMAILJS_PRIVATE_KEY;

    if (!serviceId || !templateId || !publicKey) {
      return NextResponse.json({ error: 'Missing EmailJS configuration' }, { status: 500 });
    }

    const emailData = {
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      accessToken: privateKey, // Required because Strict API Access is enabled
      template_params: {
        to_name: body.assignee_name,
        to_email: body.assignee_email,
        task_name: body.task_name,
        case_id: body.case_id,
        due_date: body.due_date,
        employee_name: body.employee_name || 'N/A',
        assigned_department: body.assigned_department || 'N/A',
        custom_message: body.message || 'Please complete this clearance task as soon as possible.',
        from_name: body.sender_name || 'OffboardIQ System'
      }
    };

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (response.ok) {
      return NextResponse.json({ success: true });
    } else {
      const errorText = await response.text();
      console.error('[EmailJS Backend Error]', errorText);
      return NextResponse.json({ error: errorText }, { status: response.status });
    }
  } catch (error: any) {
    console.error('[Email Route Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
