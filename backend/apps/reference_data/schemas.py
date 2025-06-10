from ninja import Schema

class CountryOut(Schema):
    id: int
    code: str
    name: str

class LanguageOut(Schema):
    id: int
    code: str
    name: str