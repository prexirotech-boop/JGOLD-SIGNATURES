import React from 'react';
import { Link } from 'react-router-dom';

export default function ContactPage() {
    return (
        <div className="page-layout">
            <section className="page-hero">
                <div className="page-container text-center">
                    <span className="page-badge">Support Team</span>
                    <h1>Get in Touch</h1>
                    <p className="page-subtitle">We are committed to providing top-notch support to our students and future entrepreneurs. Reach out anytime.</p>
                </div>
            </section>

            <section className="page-section">
                <div className="page-container" style={{ maxWidth: '800px' }}>
                    <div className="contact-card">
                        <div className="contact-methods">
                            
                            <div className="contact-method">
                                <div className="contact-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                </div>
                                <div>
                                    <h3>Email Support</h3>
                                    <p>For order inquiries, technical assistance, or general questions, email us at:</p>
                                    <a href="mailto:nprecious.official@gmail.com" className="contact-link">nprecious.official@gmail.com</a>
                                </div>
                            </div>

                            <div className="contact-method">
                                <div className="contact-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                </div>
                                <div>
                                    <h3>Business Hours</h3>
                                    <p>Monday – Friday<br/>9:00 AM – 5:00 PM (WAT)</p>
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="contact-note">
                        <p>
                            <strong>Note:</strong> We aim to reply to all queries within 24 hours. If your issue is regarding a lost password or course access, please ensure you email us from the exact address you used during checkout for faster verification.
                        </p>
                    </div>
                </div>
            </section>

            <style dangerouslySetInnerHTML={{__html: `
                .page-layout { background: #f8fafc; min-height: 100vh; font-family: var(--font); }
                .page-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
                .text-center { text-align: center; }
                
                .page-hero { padding: 80px 0 40px; }
                .page-badge { display: inline-block; background: #e0e7ff; color: #4338ca; padding: 6px 12px; border-radius: 50px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
                .page-hero h1 { font-size: 48px; font-weight: 800; color: #0f172a; margin: 0 0 16px; letter-spacing: -1px; }
                .page-subtitle { font-size: 18px; color: #64748b; max-width: 600px; margin: 0 auto; line-height: 1.6; }
                
                .page-section { padding: 40px 0 80px; }
                
                .contact-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                .contact-methods { display: flex; flex-direction: column; gap: 40px; }
                .contact-method { display: flex; gap: 24px; align-items: flex-start; }
                .contact-icon { width: 56px; height: 56px; border-radius: 12px; background: #f1f5f9; color: #2563eb; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .contact-icon svg { width: 28px; height: 28px; }
                .contact-method h3 { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 8px; }
                .contact-method p { color: #64748b; line-height: 1.6; margin: 0 0 8px; font-size: 15px; }
                .contact-link { color: #2563eb; font-weight: 700; font-size: 16px; text-decoration: none; transition: color 0.2s; }
                .contact-link:hover { color: #1d4ed8; text-decoration: underline; }
                
                .contact-note { margin-top: 32px; padding: 24px; background: #eff6ff; border-left: 4px solid #2563eb; border-radius: 0 12px 12px 0; }
                .contact-note p { margin: 0; color: #475569; font-size: 15px; line-height: 1.6; }
                .contact-note strong { color: #0f172a; }

                @media (max-width: 600px) {
                    .contact-method { flex-direction: column; gap: 16px; }
                    .page-hero h1 { font-size: 36px; }
                    .contact-card { padding: 24px; }
                }
            `}} />
        </div>
    );
}
