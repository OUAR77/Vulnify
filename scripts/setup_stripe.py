"""
Configura productos y precios en Stripe.

Uso:
  python scripts/setup_stripe.py sk_test_tuclave

Copia las variables que imprime y ponlas en Railway → Variables.
"""

import sys
import stripe


def main():
    if len(sys.argv) < 2:
        print("Uso: python scripts/setup_stripe.py sk_...")
        sys.exit(1)

    stripe.api_key = sys.argv[1]
    mode = "TEST" if stripe.api_key.startswith("sk_test_") else "PRODUCCIÓN"

    print(f"Creando productos y precios en Stripe (modo {mode})...\n")

    # Plan Gratis - precio 0, no necesita price en Stripe
    free = stripe.Product.create(name="Gratis", description="Plan gratuito para empezar")

    # Plan Starter
    starter = stripe.Product.create(name="Starter", description="Para empresas en crecimiento")
    starter_monthly = stripe.Price.create(product=starter.id, unit_amount=4900, currency="eur", recurring={"interval": "month"})
    starter_yearly = stripe.Price.create(product=starter.id, unit_amount=49000, currency="eur", recurring={"interval": "year"})

    # Plan Profesional
    pro = stripe.Product.create(name="Profesional", description="Para equipos de seguridad")
    pro_monthly = stripe.Price.create(product=pro.id, unit_amount=14900, currency="eur", recurring={"interval": "month"})
    pro_yearly = stripe.Price.create(product=pro.id, unit_amount=149000, currency="eur", recurring={"interval": "year"})

    print("OK - Productos creados. Copia estas variables en Railway:\n")
    print(f"STRIPE_SECRET_KEY={sys.argv[1]}")
    print(f"STRIPE_PRICE_STARTER={starter_monthly.id}")
    print(f"STRIPE_PRICE_PRO={pro_monthly.id}")
    print()
    print("Para el webhook (lo obtienes del dashboard de Stripe):")
    print("STRIPE_WEBHOOK_SECRET=whsec_...")


if __name__ == "__main__":
    main()
