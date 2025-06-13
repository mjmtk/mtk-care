# Generated manually to increase SharePoint URL field lengths

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('common', '0006_documentauditlog'),
    ]

    operations = [
        migrations.AlterField(
            model_name='document',
            name='sharepoint_server_relative_url',
            field=models.CharField(blank=True, help_text='Server-relative URL for API access', max_length=1000, null=True, verbose_name='SharePoint Server Relative URL'),
        ),
        migrations.AlterField(
            model_name='document',
            name='sharepoint_web_url',
            field=models.URLField(blank=True, help_text='URL to view file in SharePoint web interface', max_length=1000, null=True, verbose_name='SharePoint Web URL'),
        ),
        migrations.AlterField(
            model_name='document',
            name='sharepoint_download_url',
            field=models.URLField(blank=True, help_text='Direct download URL (may expire)', max_length=1000, null=True, verbose_name='SharePoint Download URL'),
        ),
    ]