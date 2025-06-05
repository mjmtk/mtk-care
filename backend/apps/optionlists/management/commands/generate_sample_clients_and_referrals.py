import random
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.client_management.models import Client
from apps.referral_management.models import Referral
from apps.optionlists.models import OptionList, OptionListItem
from django.db import transaction

FIRST_NAMES = [
    "Aroha", "James", "Sophie", "Liam", "Olivia", "Noah", "Isabella", "Mason", "Emily", "Lucas",
    "Charlotte", "Hunter", "Amelia", "Jack", "Mia", "Leo", "Ella", "Oscar", "Grace", "George"
]
LAST_NAMES = [
    "Smith", "Williams", "Brown", "Taylor", "Wilson", "Moore", "Clark", "Walker", "Hall", "Allen",
    "Young", "King", "Wright", "Scott", "Green", "Baker", "Adams", "Nelson", "Carter", "Mitchell"
]
EMAIL_DOMAINS = ["example.com", "test.org", "sample.net"]

class Command(BaseCommand):
    help = "Generate sample clients and referrals with randomized pick-list fields."

    def handle(self, *args, **options):
        num_clients = 110
        num_referrals = 110

        # Fetch OptionListItems for relevant slugs
        def get_items(slug):
            option_list = OptionList.objects.filter(slug=slug).first()
            return list(OptionListItem.objects.filter(option_list=option_list, is_active=True)) if option_list else []

        client_statuses = get_items("client-statuses")
        languages = get_items("languages")
        pronouns = get_items("pronouns")

        referral_types = get_items("referral-types")
        referral_statuses = get_items("referral-statuses")
        referral_priorities = get_items("referral-priorities")
        referral_service_types = get_items("referral-service-types")

        if not (client_statuses and languages and referral_types and referral_statuses and referral_priorities and referral_service_types):
            self.stdout.write(self.style.ERROR("Missing required OptionListItems. Check your option lists and fixtures."))
            return

        clients = []
        today = date.today()
        for i in range(num_clients):
            first_name = random.choice(FIRST_NAMES)
            last_name = random.choice(LAST_NAMES)
            dob = today - timedelta(days=random.randint(18*365, 90*365))
            email = f"{first_name.lower()}.{last_name.lower()}{i}@{random.choice(EMAIL_DOMAINS)}"
            phone = f"021{random.randint(1000000, 9999999)}"
            status = random.choice(client_statuses)
            language = random.choice(languages)
            pronoun = random.choice(pronouns) if pronouns else None
            address = f"{random.randint(1, 999)} {random.choice(LAST_NAMES)} Street"
            interpreter_needed = random.choice([True, False])
            client = Client(
                first_name=first_name,
                last_name=last_name,
                date_of_birth=dob,
                email=email,
                phone=phone,
                status=status,
                primary_language=language,
                address=address,
                interpreter_needed=interpreter_needed,
            )
            if hasattr(client, 'pronoun') and pronoun:
                client.pronoun = pronoun
            clients.append(client)
        Client.objects.bulk_create(clients)
        self.stdout.write(self.style.SUCCESS(f"Created {len(clients)} clients."))

        # Refresh from DB to get IDs
        db_clients = list(Client.objects.order_by('-created_at')[:num_clients])

        referrals = []
        for i in range(num_referrals):
            type_ = random.choice(referral_types)
            status = random.choice(referral_statuses)
            priority = random.choice(referral_priorities)
            service_type = random.choice(referral_service_types)
            client = random.choice(db_clients)
            referral_date = today - timedelta(days=random.randint(0, 365))
            accepted_date = referral_date + timedelta(days=random.randint(0, 10))
            completed_date = accepted_date + timedelta(days=random.randint(0, 20)) if random.random() > 0.3 else None
            notes = f"Sample referral notes {i}"
            reason = f"Sample referral reason {i}"
            referral = Referral(
                type=type_,
                status=status,
                priority=priority,
                service_type=service_type,
                client=client,
                client_type=random.choice(["existing", "new"]),
                referral_date=referral_date,
                accepted_date=accepted_date,
                completed_date=completed_date,
                notes=notes,
                reason=reason,
            )
            referrals.append(referral)
        Referral.objects.bulk_create(referrals)
        self.stdout.write(self.style.SUCCESS(f"Created {len(referrals)} referrals."))
