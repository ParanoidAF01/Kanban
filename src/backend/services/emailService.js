const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail', // You can change this to your preferred service
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
      }
    });
  }

  async sendEmail(to, subject, html, text = null) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'Kanban App <noreply@kanban.com>',
        to,
        subject,
        html,
        text: text || this.stripHtml(html)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  // Card assignment notification
  async sendCardAssignmentNotification(user, card, board, assignedBy) {
    const subject = `You've been assigned to "${card.title}"`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3B82F6;">Card Assignment Notification</h2>
        <p>Hello ${user.firstName},</p>
        <p>You have been assigned to a new card in the Kanban board.</p>
        
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #374151;">${card.title}</h3>
          <p style="margin: 0 0 10px 0; color: #6B7280;">${card.description}</p>
          <p style="margin: 0; font-size: 14px; color: #9CA3AF;">
            Board: ${board.name} | Assigned by: ${assignedBy.firstName} ${assignedBy.lastName}
          </p>
        </div>
        
        <p>
          <a href="${process.env.FRONTEND_URL}/board/${board.id}" 
             style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Card
          </a>
        </p>
        
        <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
          This is an automated notification from your Kanban board.
        </p>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  // Card due date reminder
  async sendCardDueDateReminder(user, card, board) {
    const subject = `Reminder: "${card.title}" is due soon`;
    const dueDate = new Date(card.dueDate).toLocaleDateString();
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #F59E0B;">Due Date Reminder</h2>
        <p>Hello ${user.firstName},</p>
        <p>This is a reminder that your assigned card is due soon.</p>
        
        <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
          <h3 style="margin: 0 0 10px 0; color: #92400E;">${card.title}</h3>
          <p style="margin: 0 0 10px 0; color: #B45309;">${card.description}</p>
          <p style="margin: 0; font-size: 14px; color: #D97706;">
            <strong>Due Date: ${dueDate}</strong> | Board: ${board.name}
          </p>
        </div>
        
        <p>
          <a href="${process.env.FRONTEND_URL}/board/${board.id}" 
             style="background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Card
          </a>
        </p>
        
        <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
          This is an automated reminder from your Kanban board.
        </p>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  // Board invitation
  async sendBoardInvitation(user, board, invitedBy) {
    const subject = `You've been invited to join "${board.name}"`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10B981;">Board Invitation</h2>
        <p>Hello ${user.firstName},</p>
        <p>${invitedBy.firstName} ${invitedBy.lastName} has invited you to collaborate on a Kanban board.</p>
        
        <div style="background: #ECFDF5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
          <h3 style="margin: 0 0 10px 0; color: #065F46;">${board.name}</h3>
          <p style="margin: 0; color: #047857;">${board.description}</p>
        </div>
        
        <p>
          <a href="${process.env.FRONTEND_URL}/board/${board.id}" 
             style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Join Board
          </a>
        </p>
        
        <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
          Start collaborating on your projects today!
        </p>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  // Welcome email for new users
  async sendWelcomeEmail(user) {
    const subject = 'Welcome to Kanban - Let\'s get started!';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3B82F6;">Welcome to Kanban!</h2>
        <p>Hello ${user.firstName},</p>
        <p>Welcome to your new collaborative workspace! We're excited to help you organize and manage your projects.</p>
        
        <div style="background: #EFF6FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px 0; color: #1E40AF;">Getting Started</h3>
          <ul style="color: #1E3A8A; margin: 0; padding-left: 20px;">
            <li>Create your first board</li>
            <li>Add columns to organize your workflow</li>
            <li>Create cards for your tasks</li>
            <li>Invite team members to collaborate</li>
          </ul>
        </div>
        
        <p>
          <a href="${process.env.FRONTEND_URL}/dashboard" 
             style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Go to Dashboard
          </a>
        </p>
        
        <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
          If you have any questions, feel free to reach out to our support team.
        </p>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  // Utility method to strip HTML tags
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }
}

module.exports = new EmailService();
