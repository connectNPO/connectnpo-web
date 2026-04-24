import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { generateEmailHtml } from '../emails/result-template.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body && typeof req.body === 'object'
      ? req.body
      : JSON.parse(req.body || '{}');

    const {
      orgName, contactName, email,
      revenueRange, orgType, fiscalYearEnd,
      score, grade, weakCategories, answers, utm
    } = body;

    if (!email || !orgName || score == null || !grade) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
      { auth: { persistSession: false } }
    );

    const { data: lead, error: dbError } = await supabase
      .from('quiz_leads')
      .insert({
        org_name: orgName,
        contact_name: contactName || null,
        email,
        revenue_range: revenueRange || null,
        org_type: orgType || null,
        fiscal_year_end: fiscalYearEnd || null,
        score,
        grade,
        weak_categories: weakCategories || [],
        answers: answers || [],
        utm_source: utm?.source || null,
        utm_medium: utm?.medium || null,
        utm_campaign: utm?.campaign || null
      })
      .select()
      .single();

    if (dbError) {
      console.error('Supabase insert error:', dbError);
      return res.status(500).json({ error: 'Database error' });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const consultationUrl = process.env.CONSULTATION_URL || '#';
    const html = generateEmailHtml({
      contactName: contactName || 'there',
      orgName,
      score,
      grade,
      weakCategories: weakCategories || [],
      consultationUrl
    });

    try {
      await transporter.sendMail({
        from: `"${process.env.FROM_NAME || 'GivingArc'}" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: `Your 990 Readiness Report - ${orgName}`,
        html
      });
    } catch (mailErr) {
      console.error('Mail send error:', mailErr);
    }

    return res.status(200).json({
      success: true,
      leadId: lead.id,
      consultationUrl
    });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
