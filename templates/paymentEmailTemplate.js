module.exports = function paymentEmailTemplate(data) {
    const {
        memberName,
        membershipPlan,
        duration,
        startDate,
        expiryDate,
        amount,
        paymentMethod,
        ownerPhone
    } = data;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f4f4f5;
                margin: 0;
                padding: 0;
                color: #18181b;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #000000 0%, #1a0000 50%, #e60000 100%);
                padding: 30px 20px;
                text-align: center;
                color: #ffffff;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                letter-spacing: 1px;
                text-transform: uppercase;
                font-weight: 800;
            }
            .header p {
                margin: 10px 0 0 0;
                font-size: 16px;
                opacity: 0.9;
            }
            .content {
                padding: 30px 40px;
            }
            .greeting {
                font-size: 18px;
                margin-bottom: 20px;
                font-weight: 600;
            }
            .message {
                line-height: 1.6;
                color: #3f3f46;
                margin-bottom: 30px;
            }
            .card {
                background-color: #fafafa;
                border: 1px solid #e4e4e7;
                border-radius: 12px;
                padding: 25px;
                margin-bottom: 30px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            }
            .card-title {
                font-size: 18px;
                font-weight: 700;
                margin-top: 0;
                margin-bottom: 20px;
                color: #e60000;
                border-bottom: 2px solid #fee2e2;
                padding-bottom: 10px;
            }
            .detail-row {
                display: flex;
                margin-bottom: 12px;
                font-size: 15px;
            }
            .detail-label {
                width: 45%;
                font-weight: 600;
                color: #52525b;
            }
            .detail-value {
                width: 55%;
                color: #18181b;
                font-weight: 500;
            }
            .footer {
                background-color: #18181b;
                color: #a1a1aa;
                text-align: center;
                padding: 20px;
                font-size: 14px;
            }
            .footer p {
                margin: 5px 0;
            }
            .contact-number {
                font-size: 18px;
                font-weight: 700;
                color: #ffffff;
                margin: 15px 0;
            }
            .motto {
                color: #e60000;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 2px;
                margin-top: 20px;
            }
            @media only screen and (max-width: 600px) {
                .content {
                    padding: 20px;
                }
                .detail-row {
                    flex-direction: column;
                }
                .detail-label, .detail-value {
                    width: 100%;
                }
                .detail-label {
                    margin-bottom: 4px;
                }
                .detail-value {
                    margin-bottom: 10px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Tara Fitness Centre</h1>
                <p>Membership Payment Confirmation</p>
            </div>
            
            <div class="content">
                <div class="greeting">Dear ${memberName},</div>
                
                <div class="message">
                    Greetings from Tara Fitness Centre! 💪<br><br>
                    Your membership payment has been successfully received and your membership has been activated/renewed.
                </div>
                
                <div class="card">
                    <h3 class="card-title">Membership Details</h3>
                    
                    <div class="detail-row">
                        <div class="detail-label">Member Name</div>
                        <div class="detail-value">${memberName}</div>
                    </div>
                    
                    <div class="detail-row">
                        <div class="detail-label">Membership Plan</div>
                        <div class="detail-value">${membershipPlan}</div>
                    </div>
                    
                    <div class="detail-row">
                        <div class="detail-label">Duration</div>
                        <div class="detail-value">${duration}</div>
                    </div>
                    
                    <div class="detail-row">
                        <div class="detail-label">Start Date</div>
                        <div class="detail-value">${startDate}</div>
                    </div>
                    
                    <div class="detail-row">
                        <div class="detail-label">Expiry Date</div>
                        <div class="detail-value">${expiryDate}</div>
                    </div>
                    
                    <div class="detail-row">
                        <div class="detail-label">Amount Paid</div>
                        <div class="detail-value">₹${amount}</div>
                    </div>
                    
                    <div class="detail-row">
                        <div class="detail-label">Payment Method</div>
                        <div class="detail-value">${paymentMethod}</div>
                    </div>
                </div>
                
                <div class="message">
                    Thank you for choosing Tara Fitness Centre as your fitness partner. We are excited to support you on your fitness journey.
                    <br><br>
                    For any queries or assistance, feel free to contact us.
                </div>
            </div>
            
            <div class="footer">
                <p>🏋️ Tara Fitness Centre</p>
                <div class="contact-number">📞 Contact: ${ownerPhone}</div>
                <div class="motto">Stay Fit • Stay Strong • Stay Consistent</div>
            </div>
        </div>
    </body>
    </html>
    `;
};
