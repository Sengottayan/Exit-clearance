export interface ReminderEmailParams {
  assignee_name: string;
  assignee_email: string;
  task_name: string;
  case_id: string;
  due_date: string;
  message?: string;
  sender_name?: string;
  employee_name?: string;
  assigned_department?: string;
}

/**
 * Sends a reminder email to an assignee via the secure backend API.
 * We use the backend API to securely pass the EmailJS Private Key
 * since the account has Strict API Access enabled.
 * 
 * @param params The template parameters to populate the email template.
 * @returns A promise that resolves when the email is sent successfully.
 */
export async function sendReminderEmail(params: ReminderEmailParams): Promise<void> {
  try {
    const response = await fetch('/api/email/reminder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status: ${response.status}`);
    }
    
    console.log('Reminder email sent successfully via secure backend route.');
  } catch (error) {
    console.error('Failed to send reminder email:', error);
    throw error;
  }
}
