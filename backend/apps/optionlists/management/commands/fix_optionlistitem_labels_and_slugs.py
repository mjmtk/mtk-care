from django.core.management.base import BaseCommand
from apps.optionlists.models import OptionListItem
import re

class Command(BaseCommand):
    help = 'Fix OptionListItem label and slug fields for all option lists.'

    def handle(self, *args, **options):
        def slugify(value):
            value = value.lower().replace('_', '-')
            value = re.sub(r'[^a-z0-9-]+', '', value)
            return value

        count = 0
        for item in OptionListItem.objects.all():
            changed = False
            # Move slug to label if label is empty or matches slug
            if not item.label or item.label == item.slug:
                item.label = item.slug
                changed = True
            # Set slug from name (replace _ with -)
            new_slug = slugify(item.name)
            if item.slug != new_slug:
                item.slug = new_slug
                changed = True
            if changed:
                item.save()
                count += 1
        self.stdout.write(self.style.SUCCESS(f"Updated {count} OptionListItems."))
