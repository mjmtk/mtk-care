# Update document category choices to match new folder structure

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('common', '0007_increase_sharepoint_url_max_length'),
    ]

    operations = [
        migrations.AlterField(
            model_name='document',
            name='folder_category',
            field=models.CharField(
                choices=[
                    ('identification', 'Identification'), 
                    ('medical-records', 'Medical Records'), 
                    ('legal', 'Legal Documents'), 
                    ('insurance', 'Insurance'), 
                    ('general-other', 'General Other'),
                    ('intake', 'Intake Documents'), 
                    ('assessments', 'Assessments'), 
                    ('treatment', 'Treatment Plans'), 
                    ('progress', 'Progress Notes'), 
                    ('discharge', 'Discharge Documents'), 
                    ('referral-other', 'Referral Other')
                ],
                default='general-other',
                help_text='Category determines SharePoint folder organization',
                max_length=50,
                verbose_name='Document Category'
            ),
        ),
    ]