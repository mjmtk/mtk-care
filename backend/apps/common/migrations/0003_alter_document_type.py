# Generated by Django 5.0.14 on 2025-06-06 19:44

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("common", "0002_document"),
        ("optionlists", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="document",
            name="type",
            field=models.ForeignKey(
                blank=True,
                limit_choices_to={"option_list__slug": "document-types"},
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="document_types",
                to="optionlists.optionlistitem",
                verbose_name="Document Type",
            ),
        ),
    ]
