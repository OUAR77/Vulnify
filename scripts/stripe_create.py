import stripe, sys
stripe.api_key = sys.argv[1]

prods = {p.name: p.id for p in stripe.Product.list(limit=20).data}
print("Productos existentes:", list(prods.keys()))

if "Gratis" not in prods:
    p = stripe.Product.create(name="Gratis", description="Plan gratuito para empezar")
    prods["Gratis"] = p.id
if "Starter" not in prods:
    p = stripe.Product.create(name="Starter", description="Para empresas en crecimiento")
    prods["Starter"] = p.id
if "Profesional" not in prods:
    p = stripe.Product.create(name="Profesional", description="Para equipos de seguridad")
    prods["Profesional"] = p.id

prices = stripe.Price.list(limit=30)
existing = {p.product: p for p in prices.data if p.recurring}

if prods.get("Starter") not in existing:
    m = stripe.Price.create(product=prods["Starter"], unit_amount=4900, currency="eur", recurring={"interval": "month"})
    y = stripe.Price.create(product=prods["Starter"], unit_amount=49000, currency="eur", recurring={"interval": "year"})
    print(f"Starter monthly: {m.id}")
    print(f"Starter yearly:  {y.id}")
else:
    for p in prices.data:
        if p.recurring:
            print(f"  {p.id} -> {p.unit_amount/100}EUR/{p.recurring['interval']} (product: {p.product[:10]}...)")

if prods.get("Profesional") not in existing:
    m = stripe.Price.create(product=prods["Profesional"], unit_amount=14900, currency="eur", recurring={"interval": "month"})
    y = stripe.Price.create(product=prods["Profesional"], unit_amount=149000, currency="eur", recurring={"interval": "year"})
    print(f"Pro monthly: {m.id}")
    print(f"Pro yearly:  {y.id}")

print("\nUsa estas prices en el .env:")
for p in stripe.Price.list(limit=10).data:
    if p.recurring:
        print(f"  {p.id}  ({p.unit_amount/100}EUR/{p.recurring['interval']})")
