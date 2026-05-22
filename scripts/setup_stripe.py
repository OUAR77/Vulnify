"""
Configura productos y precios en Stripe para el entorno de pruebas.

Uso:
  1. Crea una cuenta gratis en https://dashboard.stripe.com/register
  2. Ve a https://dashboard.stripe.com/test/apikeys y copia tu "sk_test_..."
  3. Ejecuta: python scripts/setup_stripe.py sk_test_tuclave
"""

import sys
import stripe


def main():
    if len(sys.argv) < 2:
        print("Uso: python scripts/setup_stripe.py sk_test_tuclave")
        sys.exit(1)

    stripe.api_key = sys.argv[1]

    print("Creando productos y precios en Stripe (modo test)...")

    # Plan Gratis - precio 0, no necesita producto en Stripe realmente
    # pero creamos uno por consistencia
    free = stripe.Product.create(name="Gratis", description="Plan gratuito para empezar")

    # Plan Starter - mensual
    starter = stripe.Product.create(name="Starter", description="Para empresas en crecimiento")
    starter_monthly = stripe.Price.create(
        product=starter.id,
        unit_amount=4900,  # 49€ en céntimos
        currency="eur",
        recurring={"interval": "month"},
    )
    starter_yearly = stripe.Price.create(
        product=starter.id,
        unit_amount=49000,  # 490€
        currency="eur",
        recurring={"interval": "year"},
    )

    # Plan Profesional - mensual y anual
    pro = stripe.Product.create(name="Profesional", description="Para equipos de seguridad")
    pro_monthly = stripe.Price.create(
        product=pro.id,
        unit_amount=14900,  # 149€
        currency="eur",
        recurring={"interval": "month"},
    )
    pro_yearly = stripe.Price.create(
        product=pro.id,
        unit_amount=149000,  # 1490€
        currency="eur",
        recurring={"interval": "year"},
    )

    print("\n✔ Productos y precios creados en modo TEST\n")

    print("STRIPE_SECRET_KEY=" + sys.argv[1])
    print("")

    # Gratis (precio 0)
    print("--- PLAN GRATIS ---")
    print("stripe_price_id_monthly (Gratis): " + str(free.id) + " (no necesita price, es 0€)")
    print()

    # Starter
    print("--- PLAN STARTER ---")
    print("stripe_price_id_monthly (Starter): " + starter_monthly.id)
    print("stripe_price_id_yearly (Starter): " + starter_yearly.id)
    print()

    # Profesional
    print("--- PLAN PROFESIONAL ---")
    print("stripe_price_id_monthly (Profesional): " + pro_monthly.id)
    print("stripe_price_id_yearly (Profesional): " + pro_yearly.id)
    print()

    print("Webhook secret (lo obtienes con stripe listen):")
    print("STRIPE_WEBHOOK_SECRET=whsec_...")
    print()
    print("Ejecuta esto en Python para guardar los price IDs en la base de datos:")
    print(f'''from database import SessionLocal
from sqlalchemy import text
db = SessionLocal()
# Gratis - no tiene precio real
# Starter
db.execute(text("UPDATE plans SET stripe_price_id_monthly='{starter_monthly.id}', stripe_price_id_yearly='{starter_yearly.id}' WHERE id=2"))
# Profesional
db.execute(text("UPDATE plans SET stripe_price_id_monthly='{pro_monthly.id}', stripe_price_id_yearly='{pro_yearly.id}' WHERE id=3"))
db.commit()
db.close()
print('OK')
''')


if __name__ == "__main__":
    main()
