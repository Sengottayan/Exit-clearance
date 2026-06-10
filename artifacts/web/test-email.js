const fs = require('fs');

// Simple parser for .env
function loadEnv(filePath) {
  try {
    const envData = fs.readFileSync(filePath, 'utf8');
    envData.split('\n').forEach(line => {
      const match = line.replace(/\r/g, '').match(/^([^#\s=]+)=(.*)$/);
      if (match) {
        process.env[match[1]] = match[2].trim();
      }
    });
  } catch (e) {
    console.log('No .env file found at', filePath);
  }
}

// Load from both root and artifacts/web to be safe
loadEnv('../../.env.local');
loadEnv('.env.local');

async function testEmail() {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY; // Needed if Strict Mode is on

  if (!serviceId || !templateId || !publicKey) {
    console.error('Missing EmailJS credentials in .env.local');
    return;
  }

  const TO_EMAIL = 'sengottayan2003@gmail.com'; 

  console.log(`Sending test email to ${TO_EMAIL}...`);
  console.log(`Using Service ID: ${serviceId}, Template ID: ${templateId}`);

  const data = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    accessToken: privateKey, // Required if Strict API Access is enabled
    template_params: {
      to_name: 'Sengo',
      to_email: TO_EMAIL,
      task_name: 'Simulated Clearance Task',
      case_id: 'CASE-TEST-1234',
      due_date: 'Tomorrow, 5:00 PM',
      employee_name: 'John Doe',
      assigned_department: 'IT Department',
      custom_message: 'This is an automated simulation from the backend to verify that EmailJS is fully operational and formatting the template correctly.',
      from_name: 'OffboardIQ Simulation Robot'
    }
  };

  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      console.log('✅ Success! The test email has been sent to EmailJS.');
      console.log(`Please check your inbox (${TO_EMAIL}) for the email.`);
    } else {
      const errorText = await response.text();
      console.error('❌ Failed to send email. Status:', response.status);
      console.error('Response:', errorText);
    }
  } catch (err) {
    console.error('❌ Network error occurred:', err);
  }
}

testEmail();
