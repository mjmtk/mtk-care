# Generated manually on 2025-06-13

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('common', '0004_document_access_level_document_client_id_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='document',
            name='sharepoint_unique_id',
            field=models.CharField(
                blank=True,
                help_text='SharePoint GUID for the file',
                max_length=255,
                null=True,
                verbose_name='SharePoint Unique ID'
            ),
        ),
        migrations.AddField(
            model_name='document',
            name='sharepoint_etag',
            field=models.CharField(
                blank=True,
                help_text='SharePoint ETag for version tracking',
                max_length=255,
                null=True,
                verbose_name='SharePoint ETag'
            ),
        ),
        migrations.AddField(
            model_name='document',
            name='sharepoint_server_relative_url',
            field=models.CharField(
                blank=True,
                help_text='Server-relative URL for API access',
                max_length=500,
                null=True,
                verbose_name='SharePoint Server Relative URL'
            ),
        ),
        migrations.AddField(
            model_name='document',
            name='sharepoint_web_url',
            field=models.URLField(
                blank=True,
                help_text='URL to view file in SharePoint web interface',
                max_length=500,
                null=True,
                verbose_name='SharePoint Web URL'
            ),
        ),
        migrations.AddField(
            model_name='document',
            name='sharepoint_download_url',
            field=models.URLField(
                blank=True,
                help_text='Direct download URL (may expire)',
                max_length=500,
                null=True,
                verbose_name='SharePoint Download URL'
            ),
        ),
        migrations.AddIndex(
            model_name='document',
            index=models.Index(
                fields=['sharepoint_unique_id'],
                name='common_docu_sharepoi_unique_idx'
            ),
        ),
    ]