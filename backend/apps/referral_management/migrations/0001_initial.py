# Generated by Django 5.0.14 on 2025-06-07 18:17

import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("external_organisation_management", "0001_initial"),
        ("optionlists", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Referral",
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
                ("reason", models.TextField(verbose_name="Referral Reason")),
                (
                    "notes",
                    models.TextField(blank=True, verbose_name="Additional Notes"),
                ),
                (
                    "client_type",
                    models.CharField(
                        choices=[
                            ("existing", "Existing Client"),
                            ("new", "New Client"),
                            ("self", "Self-Referral"),
                        ],
                        default="new",
                        max_length=20,
                        verbose_name="Client Type",
                    ),
                ),
                ("referral_date", models.DateField(verbose_name="Referral Date")),
                (
                    "accepted_date",
                    models.DateField(
                        blank=True, null=True, verbose_name="Accepted Date"
                    ),
                ),
                (
                    "completed_date",
                    models.DateField(
                        blank=True, null=True, verbose_name="Completed Date"
                    ),
                ),
                (
                    "follow_up_date",
                    models.DateField(
                        blank=True, null=True, verbose_name="Follow-up Date"
                    ),
                ),
                (
                    "client_consent_date",
                    models.DateField(
                        blank=True, null=True, verbose_name="Client Consent Date"
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
                    "external_organisation",
                    models.ForeignKey(
                        blank=True,
                        help_text="Referring organisation (null for self-referrals)",
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="referrals",
                        to="external_organisation_management.externalorganisation",
                        verbose_name="External Organisation",
                    ),
                ),
                (
                    "external_organisation_contact",
                    models.ForeignKey(
                        blank=True,
                        help_text="Contact person at referring organisation",
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="referrals",
                        to="external_organisation_management.externalorganisationcontact",
                        verbose_name="External Organisation Contact",
                    ),
                ),
                (
                    "priority",
                    models.ForeignKey(
                        limit_choices_to={"option_list__slug": "referral-priorities"},
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="referral_priority_referrals",
                        to="optionlists.optionlistitem",
                        verbose_name="Priority",
                    ),
                ),
                (
                    "service_type",
                    models.ForeignKey(
                        limit_choices_to={
                            "option_list__slug": "referral-service-types"
                        },
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="referral_service_type_referrals",
                        to="optionlists.optionlistitem",
                        verbose_name="Service Type",
                    ),
                ),
                (
                    "status",
                    models.ForeignKey(
                        limit_choices_to={"option_list__slug": "referral-statuses"},
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="referral_status_referrals",
                        to="optionlists.optionlistitem",
                        verbose_name="Status",
                    ),
                ),
                (
                    "type",
                    models.ForeignKey(
                        limit_choices_to={"option_list__slug": "referral-types"},
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="referral_type_referrals",
                        to="optionlists.optionlistitem",
                        verbose_name="Referral Type",
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
                "verbose_name": "Referral",
                "verbose_name_plural": "Referrals",
                "ordering": ["-referral_date", "-created_at"],
                "indexes": [
                    models.Index(
                        fields=["status"], name="referral_ma_status__118ae7_idx"
                    ),
                    models.Index(
                        fields=["type"], name="referral_ma_type_id_01466d_idx"
                    ),
                    models.Index(
                        fields=["referral_date"], name="referral_ma_referra_9bb264_idx"
                    ),
                    models.Index(
                        fields=["service_type"], name="referral_ma_service_9a4a37_idx"
                    ),
                    models.Index(
                        fields=["client_type"], name="referral_ma_client__127063_idx"
                    ),
                ],
            },
        ),
    ]
