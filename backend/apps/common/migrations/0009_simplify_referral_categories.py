# Simplify referral document categories - remove subfolders, use metadata instead

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('common', '0008_update_document_categories'),
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
                    ('referral', 'Referral Document'),
                ],
                default='general-other',
                help_text='Category determines SharePoint folder organization',
                max_length=50,
                verbose_name='Document Category'
            ),
        ),
    ]