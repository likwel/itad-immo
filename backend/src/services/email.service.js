import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: +process.env.EMAIL_PORT,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
})

export const sendEmail = ({ to, subject, html }) =>
  transporter.sendMail({ from: process.env.FROM_EMAIL, to, subject, html })

export const sendBookingConfirmation = (to, booking) =>
  sendEmail({
    to,
    subject: '✅ Réservation confirmée — itad-immo',
    html: `<h2>Votre réservation est confirmée!</h2>
           <p>Bien: <strong>${booking.property.title}</strong></p>
           <p>Date: ${new Date(booking.startDate).toLocaleDateString('fr-FR')}</p>
           <p>Montant: <strong>${booking.totalPrice.toLocaleString()} MGA</strong></p>`
  })
