import httpx
r = httpx.get('http://localhost:8000/company/billing')
print(f'Billing page: status={r.status_code}, length={len(r.text)}')
checks = ['themeToggle', 'Cargando', 'script.js', 'loadBilling', 'subscribe']
for c in checks:
    print(f'  Contains {c}: {c in r.text}')
