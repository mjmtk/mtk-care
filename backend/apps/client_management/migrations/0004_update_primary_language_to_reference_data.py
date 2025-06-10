# Generated migration to update primary_language to use reference_data.Language
from django.db import migrations, models
import django.db.models.deletion


def migrate_language_data(apps, schema_editor):
    """Migrate existing language data from option lists to reference data."""
    Client = apps.get_model('client_management', 'Client')
    Language = apps.get_model('reference_data', 'Language')
    OptionListItem = apps.get_model('optionlists', 'OptionListItem')
    
    # Create a mapping from option list languages to reference languages
    language_mapping = {
        'en': 'en',  # English
        'mi': 'mi',  # Te Reo Māori
        'zh': 'zh',  # Mandarin
        'es': 'es',  # Spanish
    }
    
    # Get all clients with language option list items
    clients_with_languages = Client.objects.filter(primary_language_old__isnull=False)
    
    for client in clients_with_languages:
        try:
            # Get the option list item
            option_item = client.primary_language_old
            
            # Try to find the corresponding reference language
            ref_language = None
            for option_value, ref_code in language_mapping.items():
                if option_item.value == option_value:
                    try:
                        ref_language = Language.objects.get(code=ref_code)
                        break
                    except Language.DoesNotExist:
                        continue
            
            if ref_language:
                client.primary_language = ref_language
                client.save()
            else:
                print(f"Warning: Could not map language for client {client.id}: {option_item.value}")
                
        except Exception as e:
            print(f"Error migrating language for client {client.id}: {e}")


def reverse_migration(apps, schema_editor):
    """Reverse migration - not implemented as this would lose data."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('client_management', '0003_alter_client_cultural_identity'),
        ('reference_data', '0001_initial'),
    ]

    operations = [
        # Step 1: Add new primary_language field pointing to reference_data.Language
        migrations.AddField(
            model_name='client',
            name='primary_language_new',
            field=models.ForeignKey(
                blank=True,
                help_text="Client's preferred language",
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='primary_language_clients_new',
                to='reference_data.language',
                verbose_name='Primary Language'
            ),
        ),
        
        # Step 2: Rename old field to temporary name
        migrations.RenameField(
            model_name='client',
            old_name='primary_language',
            new_name='primary_language_old',
        ),
        
        # Step 3: Migrate data from old to new field
        migrations.RunPython(migrate_language_data, reverse_migration),
        
        # Step 4: Rename new field to primary_language
        migrations.RenameField(
            model_name='client',
            old_name='primary_language_new',
            new_name='primary_language',
        ),
        
        # Step 5: Remove old field
        migrations.RemoveField(
            model_name='client',
            name='primary_language_old',
        ),
    ]