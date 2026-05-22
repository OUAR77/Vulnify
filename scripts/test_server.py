import httpx
base = 'http://localhost:8000'

r = httpx.get(base + '/api/plans')
print(f'/api/plans: {r.status_code} ({len(r.json())} plans)')

r = httpx.get(base + '/company/billing')
print(f'/company/billing: {r.status_code}')

r = httpx.post(base + '/api/auth/login', json={'email':'empresa@test.com','password':'TestPass1'})
print(f'Login empresa: {r.status_code}')
if r.status_code == 200:
    tok = r.json()['token']
    h = {'Authorization': f'Bearer {tok}'}
    r = httpx.get(base + '/api/company/subscription', headers=h)
    print(f'/company/subscription: {r.status_code} {r.text[:200]}')

r = httpx.post(base + '/api/auth/login', json={'email':'admin@vulnify.com','password':'admin123456'})
if r.status_code == 200:
    tok = r.json()['token']
    h = {'Authorization': f'Bearer {tok}', 'Content-Type': 'application/json'}
    r = httpx.get(base + '/api/admin/plans', headers=h)
    print(f'/api/admin/plans: {r.status_code} ({len(r.json())} plans)')
