# Generated by Django 5.0.14 on 2025-06-07 11:59

import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("optionlists", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ExternalOrganisation",
            fields=[
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True, verbose_name="Created At"),
                ),
                (
                    "updated_at",
                    models.DateTimeField(auto_now=True, verbose_name="Updated At"),
                ),
                (
                    "is_deleted",
                    models.BooleanField(
                        db_index=True, default=False, verbose_name="Is Deleted"
                    ),
                ),
                (
                    "deleted_at",
                    models.DateTimeField(
                        blank=True, null=True, verbose_name="Deleted At"
                    ),
                ),
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "last_synced_at",
                    models.DateTimeField(
                        blank=True, null=True, verbose_name="Last Synced At"
                    ),
                ),
                (
                    "name",
                    models.CharField(
                        max_length=255, unique=True, verbose_name="Organisation Name"
                    ),
                ),
                (
                    "phone",
                    models.CharField(
                        blank=True, max_length=50, verbose_name="Organisation Phone"
                    ),
                ),
                (
                    "email",
                    models.EmailField(
                        blank=True,
                        max_length=254,
                        null=True,
                        verbose_name="Organisation Email",
                    ),
                ),
                (
                    "address",
                    models.CharField(
                        blank=True, max_length=255, verbose_name="Address"
                    ),
                ),
                ("is_active", models.BooleanField(default=True, verbose_name="Active")),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(app_label)s_%(class)s_created_by_audit",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Created By",
                    ),
                ),
                (
                    "deleted_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(app_label)s_%(class)s_deleted_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Deleted By",
                    ),
                ),
                (
                    "type",
                    models.ForeignKey(
                        limit_choices_to={
                            "option_list__slug": "external_organisation-types"
                        },
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="external_organisation_type_organisations",
                        to="optionlists.optionlistitem",
                        verbose_name="Organisation Type",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(app_label)s_%(class)s_updated_by_audit",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Updated By",
                    ),
                ),
            ],
            options={
                "verbose_name": "External Organisation",
                "verbose_name_plural": "External Organisations",
                "ordering": ["name"],
            },
        ),
        migrations.CreateModel(
            name="ExternalOrganisationContact",
            fields=[
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True, verbose_name="Created At"),
                ),
                (
                    "updated_at",
                    models.DateTimeField(auto_now=True, verbose_name="Updated At"),
                ),
                (
                    "is_deleted",
                    models.BooleanField(
                        db_index=True, default=False, verbose_name="Is Deleted"
                    ),
                ),
                (
                    "deleted_at",
                    models.DateTimeField(
                        blank=True, null=True, verbose_name="Deleted At"
                    ),
                ),
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "last_synced_at",
                    models.DateTimeField(
                        blank=True, null=True, verbose_name="Last Synced At"
                    ),
                ),
                (
                    "first_name",
                    models.CharField(max_length=100, verbose_name="First Name"),
                ),
                (
                    "last_name",
                    models.CharField(max_length=100, verbose_name="Last Name"),
                ),
                (
                    "job_title",
                    models.CharField(
                        blank=True, max_length=100, verbose_name="Job Title"
                    ),
                ),
                ("is_active", models.BooleanField(default=True, verbose_name="Active")),
                ("notes", models.TextField(blank=True, verbose_name="Notes")),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(app_label)s_%(class)s_created_by_audit",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Created By",
                    ),
                ),
                (
                    "deleted_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(app_label)s_%(class)s_deleted_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Deleted By",
                    ),
                ),
                (
                    "organisation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="contacts",
                        to="external_organisation_management.externalorganisation",
                        verbose_name="Organisation",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(app_label)s_%(class)s_updated_by_audit",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Updated By",
                    ),
                ),
            ],
            options={
                "verbose_name": "External Organisation Contact",
                "verbose_name_plural": "External Organisation Contacts",
                "ordering": ["organisation__name", "last_name", "first_name"],
            },
        ),
        migrations.CreateModel(
            name="EmailAddress",
            fields=[
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True, verbose_name="Created At"),
                ),
                (
                    "updated_at",
                    models.DateTimeField(auto_now=True, verbose_name="Updated At"),
                ),
                (
                    "is_deleted",
                    models.BooleanField(
                        db_index=True, default=False, verbose_name="Is Deleted"
                    ),
                ),
                (
                    "deleted_at",
                    models.DateTimeField(
                        blank=True, null=True, verbose_name="Deleted At"
                    ),
                ),
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "last_synced_at",
                    models.DateTimeField(
                        blank=True, null=True, verbose_name="Last Synced At"
                    ),
                ),
                (
                    "email",
                    models.EmailField(max_length=254, verbose_name="Email Address"),
                ),
                ("is_active", models.BooleanField(default=True, verbose_name="Active")),
                (
                    "is_primary",
                    models.BooleanField(default=False, verbose_name="Primary"),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(app_label)s_%(class)s_created_by_audit",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Created By",
                    ),
                ),
                (
                    "deleted_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(app_label)s_%(class)s_deleted_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Deleted By",
                    ),
                ),
                (
                    "type",
                    models.ForeignKey(
                        limit_choices_to={"option_list__slug": "common-email-types"},
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="email_type_emails",
                        to="optionlists.optionlistitem",
                        verbose_name="Email Type",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(app_label)s_%(class)s_updated_by_audit",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Updated By",
                    ),
                ),
                (
                    "organisation",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="emails",
                        to="external_organisation_management.externalorganisation",
                        verbose_name="Organisation",
                    ),
                ),
                (
                    "contact",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="emails",
                        to="external_organisation_management.externalorganisationcontact",
                        verbose_name="Contact",
                    ),
                ),
            ],
            options={
                "verbose_name": "Email Address",
                "verbose_name_plural": "Email Addresses",
                "ordering": ["email"],
            },
        ),
        migrations.CreateModel(
            name="PhoneNumber",
            fields=[
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True, verbose_name="Created At"),
                ),
                (
                    "updated_at",
                    models.DateTimeField(auto_now=True, verbose_name="Updated At"),
                ),
                (
                    "is_deleted",
                    models.BooleanField(
                        db_index=True, default=False, verbose_name="Is Deleted"
                    ),
                ),
                (
                    "deleted_at",
                    models.DateTimeField(
                        blank=True, null=True, verbose_name="Deleted At"
                    ),
                ),
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "last_synced_at",
                    models.DateTimeField(
                        blank=True, null=True, verbose_name="Last Synced At"
                    ),
                ),
                (
                    "number",
                    models.CharField(max_length=50, verbose_name="Phone Number"),
                ),
                ("is_active", models.BooleanField(default=True, verbose_name="Active")),
                (
                    "notes",
                    models.TextField(blank=True, null=True, verbose_name="Notes"),
                ),
                (
                    "contact",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="phones",
                        to="external_organisation_management.externalorganisationcontact",
                        verbose_name="Contact",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(app_label)s_%(class)s_created_by_audit",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Created By",
                    ),
                ),
                (
                    "deleted_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(app_label)s_%(class)s_deleted_by",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Deleted By",
                    ),
                ),
                (
                    "organisation",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="phones",
                        to="external_organisation_management.externalorganisation",
                        verbose_name="Organisation",
                    ),
                ),
                (
                    "type",
                    models.ForeignKey(
                        limit_choices_to={"option_list__slug": "common-phone-types"},
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="phone_type_phones",
                        to="optionlists.optionlistitem",
                        verbose_name="Phone Type",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(app_label)s_%(class)s_updated_by_audit",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Updated By",
                    ),
                ),
            ],
            options={
                "verbose_name": "Phone Number",
                "verbose_name_plural": "Phone Numbers",
                "ordering": ["number"],
            },
        ),
    ]
