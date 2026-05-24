import './globals.css';
import Layout from './components/Layout';
import ToastProvider from './components/ToastProvider';

export const metadata = {
  title: 'SERENA – Partido State University CEC Transparency Portal',
  description: 'System for Evaluation, Reporting, Engagement, Notification, and Accountability',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider />
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}