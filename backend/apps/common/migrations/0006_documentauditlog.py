# Generated manually on 2025-06-13

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('common', '0005_add_enhanced_sharepoint_fields'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='DocumentAuditLog',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Updated At')),
                ('is_deleted', models.BooleanField(db_index=True, default=False, verbose_name='Is Deleted')),
                ('deleted_at', models.DateTimeField(blank=True, null=True, verbose_name='Deleted At')),
                ('last_synced_at', models.DateTimeField(blank=True, null=True, verbose_name='Last Synced At')),
                ('action', models.CharField(
                    choices=[
                        ('uploaded', 'Document Uploaded'),
                        ('viewed', 'Document Viewed'),
                        ('downloaded', 'Document Downloaded'),
                        ('updated', 'Document Updated'),
                        ('deleted', 'Document Deleted'),
                        ('shared', 'Document Shared'),
                        ('access_denied', 'Access Denied'),
                    ],
                    max_length=50,
                    verbose_name='Action'
                )),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True, verbose_name='IP Address')),
                ('user_agent', models.TextField(blank=True, null=True, verbose_name='User Agent')),
                ('success', models.BooleanField(
                    default=True,
                    help_text='Whether the action was successful',
                    verbose_name='Success'
                )),
                ('error_message', models.TextField(
                    blank=True,
                    help_text='Error details if action failed',
                    null=True,
                    verbose_name='Error Message'
                )),
                ('metadata', models.JSONField(
                    blank=True,
                    default=dict,
                    help_text='Extra context about the action',
                    verbose_name='Additional Metadata'
                )),
                ('created_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='common_documentauditlog_created_by_audit',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Created By'
                )),
                ('deleted_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='common_documentauditlog_deleted_by',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Deleted By'
                )),
                ('document', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='audit_logs',
                    to='common.document',
                    verbose_name='Document'
                )),
                ('updated_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='common_documentauditlog_updated_by_audit',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Updated By'
                )),
                ('user', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='document_audit_logs',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='User'
                )),
            ],
            options={
                'verbose_name': 'Document Audit Log',
                'verbose_name_plural': 'Document Audit Logs',
                'ordering': ['-created_at'],
                'app_label': 'common',
            },
        ),
        migrations.AddIndex(
            model_name='documentauditlog',
            index=models.Index(fields=['document'], name='common_docu_documen_audit_idx'),
        ),
        migrations.AddIndex(
            model_name='documentauditlog',
            index=models.Index(fields=['user'], name='common_docu_user_audit_idx'),
        ),
        migrations.AddIndex(
            model_name='documentauditlog',
            index=models.Index(fields=['action'], name='common_docu_action_audit_idx'),
        ),
        migrations.AddIndex(
            model_name='documentauditlog',
            index=models.Index(fields=['created_at'], name='common_docu_created_audit_idx'),
        ),
        migrations.AddIndex(
            model_name='documentauditlog',
            index=models.Index(fields=['ip_address'], name='common_docu_ip_addr_audit_idx'),
        ),
    ]