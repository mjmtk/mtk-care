from django.db import models

class Country(models.Model):
    code = models.CharField(max_length=3, unique=True)  # ISO 3166-1 alpha-3
    name = models.CharField(max_length=128)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "countries"
        ordering = [
            models.Case(
                models.When(code="NZL", then=0),
                models.When(code="AUS", then=1),
                default=2,
                output_field=models.IntegerField(),
            ),
            'name',
        ]

    def __str__(self):
        return self.name

class Language(models.Model):
    code = models.CharField(max_length=12, unique=True)  # ISO 639-1 or custom
    name = models.CharField(max_length=128)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "languages"
        ordering = [
            models.Case(
                models.When(code="mi", then=0),  # Te Reo Māori
                models.When(code="en", then=1),
                models.When(code="sm", then=2),
                default=3,
                output_field=models.IntegerField(),
            ),
            'name',
        ]

    def __str__(self):
        return self.name
