"""
Alert Management and Notification System for DataMantri
Handles monitoring of data sources, pipelines, queries, dashboards, and SLAs
"""
import os
import smtplib
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    """Multi-channel notification service"""
    
    def __init__(self):
        # Email configuration
        self.smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_username = os.getenv('SMTP_USERNAME', '')
        self.smtp_password = os.getenv('SMTP_PASSWORD', '')
        self.smtp_from = os.getenv('SMTP_FROM', 'alerts@datamantri.com')
        
        # Twilio configuration (for WhatsApp)
        self.twilio_account_sid = os.getenv('TWILIO_ACCOUNT_SID', '')
        self.twilio_auth_token = os.getenv('TWILIO_AUTH_TOKEN', '')
        self.twilio_whatsapp_from = os.getenv('TWILIO_WHATSAPP_FROM', '')
    
    def send_email(self, recipients: List[str], subject: str, body: str, html_body: Optional[str] = None) -> Dict[str, Any]:
        """
        Send email notification
        
        Args:
            recipients: List of email addresses
            subject: Email subject
            body: Plain text body
            html_body: Optional HTML body
        
        Returns:
            dict: {'success': bool, 'message': str, 'error': str}
        """
        try:
            if not self.smtp_username or not self.smtp_password:
                logger.warning("SMTP credentials not configured")
                return {'success': False, 'error': 'SMTP not configured'}
            
            msg = MIMEMultipart('alternative')
            msg['From'] = self.smtp_from
            msg['To'] = ', '.join(recipients)
            msg['Subject'] = subject
            
            # Attach plain text
            msg.attach(MIMEText(body, 'plain'))
            
            # Attach HTML if provided
            if html_body:
                msg.attach(MIMEText(html_body, 'html'))
            
            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            logger.info(f"Email sent to {len(recipients)} recipients")
            return {'success': True, 'message': f'Sent to {len(recipients)} recipients'}
            
        except Exception as e:
            logger.error(f"Email send failed: {e}")
            return {'success': False, 'error': str(e)}
    
    def send_slack(self, webhook_url: str, message: str, severity: str = 'warning') -> Dict[str, Any]:
        """
        Send Slack notification
        
        Args:
            webhook_url: Slack incoming webhook URL
            message: Message to send
            severity: Alert severity (info, warning, critical)
        
        Returns:
            dict: {'success': bool, 'message': str, 'error': str}
        """
        try:
            if not webhook_url:
                return {'success': False, 'error': 'Slack webhook URL not provided'}
            
            # Color based on severity
            color_map = {
                'info': '#36a64f',  # Green
                'warning': '#ff9900',  # Orange
                'critical': '#ff0000'  # Red
            }
            color = color_map.get(severity, '#ff9900')
            
            payload = {
                "attachments": [{
                    "color": color,
                    "title": "⚠️ DataMantri Alert",
                    "text": message,
                    "footer": "DataMantri Alert System",
                    "ts": int(datetime.utcnow().timestamp())
                }]
            }
            
            response = requests.post(webhook_url, json=payload, timeout=10)
            
            if response.status_code == 200:
                logger.info("Slack notification sent successfully")
                return {'success': True, 'message': 'Slack notification sent'}
            else:
                logger.error(f"Slack send failed: {response.status_code} - {response.text}")
                return {'success': False, 'error': f'HTTP {response.status_code}'}
                
        except Exception as e:
            logger.error(f"Slack send failed: {e}")
            return {'success': False, 'error': str(e)}
    
    def send_teams(self, webhook_url: str, message: str, severity: str = 'warning') -> Dict[str, Any]:
        """
        Send Microsoft Teams notification
        
        Args:
            webhook_url: Teams incoming webhook URL
            message: Message to send
            severity: Alert severity (info, warning, critical)
        
        Returns:
            dict: {'success': bool, 'message': str, 'error': str}
        """
        try:
            if not webhook_url:
                return {'success': False, 'error': 'Teams webhook URL not provided'}
            
            # Theme color based on severity
            color_map = {
                'info': '0076D7',  # Blue
                'warning': 'FFA500',  # Orange
                'critical': 'FF0000'  # Red
            }
            theme_color = color_map.get(severity, 'FFA500')
            
            payload = {
                "@type": "MessageCard",
                "@context": "http://schema.org/extensions",
                "themeColor": theme_color,
                "summary": "DataMantri Alert",
                "sections": [{
                    "activityTitle": "⚠️ DataMantri Alert",
                    "text": message,
                    "markdown": True
                }]
            }
            
            response = requests.post(webhook_url, json=payload, timeout=10)
            
            if response.status_code == 200:
                logger.info("Teams notification sent successfully")
                return {'success': True, 'message': 'Teams notification sent'}
            else:
                logger.error(f"Teams send failed: {response.status_code} - {response.text}")
                return {'success': False, 'error': f'HTTP {response.status_code}'}
                
        except Exception as e:
            logger.error(f"Teams send failed: {e}")
            return {'success': False, 'error': str(e)}
    
    def send_whatsapp(self, phone_numbers: List[str], message: str) -> Dict[str, Any]:
        """
        Send WhatsApp notification via Twilio
        
        Args:
            phone_numbers: List of phone numbers (E.164 format)
            message: Message to send
        
        Returns:
            dict: {'success': bool, 'message': str, 'error': str}
        """
        try:
            if not self.twilio_account_sid or not self.twilio_auth_token:
                logger.warning("Twilio credentials not configured")
                return {'success': False, 'error': 'Twilio not configured'}
            
            from twilio.rest import Client
            
            client = Client(self.twilio_account_sid, self.twilio_auth_token)
            
            sent_count = 0
            errors = []
            
            for phone in phone_numbers:
                try:
                    # Ensure phone number starts with whatsapp:
                    whatsapp_to = phone if phone.startswith('whatsapp:') else f'whatsapp:{phone}'
                    
                    message_obj = client.messages.create(
                        body=message,
                        from_=self.twilio_whatsapp_from,
                        to=whatsapp_to
                    )
                    sent_count += 1
                    logger.info(f"WhatsApp sent to {phone}: {message_obj.sid}")
                    
                except Exception as e:
                    errors.append(f"{phone}: {str(e)}")
                    logger.error(f"WhatsApp send to {phone} failed: {e}")
            
            if sent_count > 0:
                return {
                    'success': True,
                    'message': f'Sent to {sent_count}/{len(phone_numbers)} recipients',
                    'errors': errors if errors else None
                }
            else:
                return {
                    'success': False,
                    'error': 'Failed to send to all recipients',
                    'errors': errors
                }
                
        except Exception as e:
            logger.error(f"WhatsApp send failed: {e}")
            return {'success': False, 'error': str(e)}
    
    def send_notification(self, alert: Dict[str, Any], alert_data: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
        """
        Send notifications to all configured channels
        
        Args:
            alert: Alert configuration dict
            alert_data: Data about the alert condition
        
        Returns:
            dict: Results for each channel
        """
        results = {}
        
        channels = alert.get('channels', [])
        recipients = alert.get('recipients', {})
        severity = alert_data.get('severity', 'warning')
        
        # Build message
        subject = f"⚠️ Alert: {alert['name']}"
        message = self._build_message(alert, alert_data)
        html_message = self._build_html_message(alert, alert_data)
        
        # Send to each channel
        if 'email' in channels and recipients.get('email'):
            results['email'] = self.send_email(
                recipients['email'],
                subject,
                message,
                html_message
            )
        
        if 'slack' in channels and recipients.get('slack'):
            results['slack'] = self.send_slack(
                recipients['slack'],
                message,
                severity
            )
        
        if 'teams' in channels and recipients.get('teams'):
            results['teams'] = self.send_teams(
                recipients['teams'],
                message,
                severity
            )
        
        if 'whatsapp' in channels and recipients.get('whatsapp'):
            results['whatsapp'] = self.send_whatsapp(
                recipients['whatsapp'],
                message
            )
        
        return results
    
    def _build_message(self, alert: Dict[str, Any], alert_data: Dict[str, Any]) -> str:
        """Build plain text alert message"""
        condition_type = alert.get('condition_type', '')
        condition_details = alert_data.get('details', {})
        
        message = f"""
DataMantri Alert Triggered

Alert: {alert['name']}
Type: {condition_type.replace('_', ' ').title()}
Severity: {alert_data.get('severity', 'warning').upper()}
Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}

Details:
"""
        
        for key, value in condition_details.items():
            message += f"  • {key.replace('_', ' ').title()}: {value}\n"
        
        message += f"\n---\nDataMantri Alert System\n"
        
        return message
    
    def _build_html_message(self, alert: Dict[str, Any], alert_data: Dict[str, Any]) -> str:
        """Build HTML alert message"""
        severity = alert_data.get('severity', 'warning')
        severity_colors = {
            'info': '#0066cc',
            'warning': '#ff9900',
            'critical': '#cc0000'
        }
        color = severity_colors.get(severity, '#ff9900')
        
        condition_details = alert_data.get('details', {})
        details_html = ''
        for key, value in condition_details.items():
            details_html += f"<li><strong>{key.replace('_', ' ').title()}:</strong> {value}</li>"
        
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: {color}; color: white; padding: 20px; border-radius: 5px 5px 0 0; }}
        .content {{ background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px; }}
        .footer {{ margin-top: 20px; text-align: center; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>⚠️ DataMantri Alert Triggered</h2>
        </div>
        <div class="content">
            <p><strong>Alert:</strong> {alert['name']}</p>
            <p><strong>Type:</strong> {alert.get('condition_type', '').replace('_', ' ').title()}</p>
            <p><strong>Severity:</strong> <span style="color: {color}; font-weight: bold;">{severity.upper()}</span></p>
            <p><strong>Time:</strong> {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
            
            <h3>Details:</h3>
            <ul>
                {details_html}
            </ul>
        </div>
        <div class="footer">
            <p>DataMantri Alert System</p>
        </div>
    </div>
</body>
</html>
"""
        return html


class AlertEvaluator:
    """Evaluates alert conditions"""
    
    def __init__(self, db, DataSource, Pipeline, PipelineRun):
        self.db = db
        self.DataSource = DataSource
        self.Pipeline = Pipeline
        self.PipelineRun = PipelineRun
    
    def check_datasource_failure(self, config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Check if data source is failing
        
        Args:
            config: {'datasource_id': 'xxx', 'check_interval_minutes': 5}
        
        Returns:
            Alert data if condition met, None otherwise
        """
        datasource_id = config.get('datasource_id')
        if not datasource_id:
            return None
        
        try:
            datasource = self.DataSource.query.get(datasource_id)
            if not datasource:
                return None
            
            # Try to connect
            from sqlalchemy import create_engine, text
            
            if datasource.connection_type == 'postgresql':
                conn_str = f"postgresql://{datasource.username}:{datasource.password}@{datasource.host}:{datasource.port}/{datasource.database}?gssencmode=disable"
            elif datasource.connection_type == 'mysql':
                conn_str = f"mysql+pymysql://{datasource.username}:{datasource.password}@{datasource.host}:{datasource.port}/{datasource.database}"
            else:
                return None
            
            engine = create_engine(conn_str, pool_pre_ping=True, connect_args={'connect_timeout': 5})
            
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            
            engine.dispose()
            
            # Connection successful - no alert
            return None
            
        except Exception as e:
            # Connection failed - trigger alert
            return {
                'severity': 'critical',
                'details': {
                    'datasource_name': datasource.name,
                    'datasource_id': datasource_id,
                    'error': str(e),
                    'host': datasource.host,
                    'port': datasource.port
                }
            }
    
    def check_pipeline_failure(self, config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Check if pipeline has failed
        
        Args:
            config: {'pipeline_id': 'xxx', 'check_last_n_runs': 1}
        
        Returns:
            Alert data if condition met, None otherwise
        """
        pipeline_id = config.get('pipeline_id')
        check_last_n = config.get('check_last_n_runs', 1)
        
        if not pipeline_id:
            return None
        
        try:
            pipeline = self.Pipeline.query.get(pipeline_id)
            if not pipeline:
                return None
            
            # Get last N runs
            runs = self.PipelineRun.query.filter_by(
                pipeline_id=pipeline_id
            ).order_by(
                self.PipelineRun.start_time.desc()
            ).limit(check_last_n).all()
            
            if not runs:
                return None
            
            # Check if any failed
            failed_runs = [r for r in runs if r.status in ['failed', 'error']]
            
            if failed_runs:
                latest_failed = failed_runs[0]
                return {
                    'severity': 'critical',
                    'details': {
                        'pipeline_name': pipeline.name,
                        'pipeline_id': pipeline_id,
                        'run_id': latest_failed.id,
                        'error': latest_failed.error_message or 'Pipeline execution failed',
                        'failed_records': latest_failed.records_failed or 0,
                        'start_time': latest_failed.start_time.isoformat() if latest_failed.start_time else None
                    }
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Error checking pipeline failure: {e}")
            return None
    
    def check_query_slow(self, config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Check if query execution is slow
        
        This would need to be integrated with actual query tracking
        For now, returns None
        """
        # TODO: Implement query performance monitoring
        return None
    
    def check_dashboard_failure(self, config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Check if dashboard scheduler has failed
        
        This would need to be integrated with dashboard scheduling
        For now, returns None
        """
        # TODO: Implement dashboard scheduler monitoring
        return None
    
    def check_sla_breach(self, config: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Check if SLA has been breached
        
        Args:
            config: {'datasource_id': 'xxx', 'expected_load_time': '09:00', 'tolerance_minutes': 30}
        
        Returns:
            Alert data if condition met, None otherwise
        """
        datasource_id = config.get('datasource_id')
        expected_time_str = config.get('expected_load_time')  # HH:MM format
        tolerance_minutes = config.get('tolerance_minutes', 30)
        
        if not datasource_id or not expected_time_str:
            return None
        
        try:
            datasource = self.DataSource.query.get(datasource_id)
            if not datasource:
                return None
            
            # Parse expected time
            from datetime import time as dt_time
            hour, minute = map(int, expected_time_str.split(':'))
            expected_time = dt_time(hour, minute)
            
            # Get current time
            now = datetime.utcnow()
            current_time = now.time()
            
            # Calculate if we're past the SLA window
            expected_datetime = datetime.combine(now.date(), expected_time)
            sla_deadline = expected_datetime + timedelta(minutes=tolerance_minutes)
            
            # Check if data was loaded recently (this is simplified)
            # In reality, you'd check the last_updated timestamp of the datasource
            if now > sla_deadline and datasource.last_sync:
                time_since_sync = now - datasource.last_sync
                
                if time_since_sync > timedelta(hours=24):  # No sync in 24 hours
                    return {
                        'severity': 'warning',
                        'details': {
                            'datasource_name': datasource.name,
                            'datasource_id': datasource_id,
                            'expected_load_time': expected_time_str,
                            'tolerance_minutes': tolerance_minutes,
                            'last_sync': datasource.last_sync.isoformat() if datasource.last_sync else 'Never',
                            'delay_hours': int(time_since_sync.total_seconds() / 3600)
                        }
                    }
            
            return None
            
        except Exception as e:
            logger.error(f"Error checking SLA: {e}")
            return None
    
    def evaluate_alert(self, alert: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Evaluate a single alert
        
        Args:
            alert: Alert configuration dict
        
        Returns:
            Alert data if triggered, None otherwise
        """
        condition_type = alert.get('condition_type')
        condition_config = alert.get('condition_config', {})
        
        if condition_type == 'datasource_failure':
            return self.check_datasource_failure(condition_config)
        elif condition_type == 'pipeline_failure':
            return self.check_pipeline_failure(condition_config)
        elif condition_type == 'query_slow':
            return self.check_query_slow(condition_config)
        elif condition_type == 'dashboard_failure':
            return self.check_dashboard_failure(condition_config)
        elif condition_type == 'sla_breach':
            return self.check_sla_breach(condition_config)
        else:
            logger.warning(f"Unknown alert condition type: {condition_type}")
            return None

