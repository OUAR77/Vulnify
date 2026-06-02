import requests
import hashlib
import socket
import re
import json
import logging
from datetime import datetime
from urllib.parse import urlparse
from config import settings

logger = logging.getLogger("vulnify.intel")

HIBP_API = "https://haveibeenpwned.com/api/v3"
HIBP_PW_RANGE = "https://api.pwnedpasswords.com/range"
GITHUB_API = "https://api.github.com"

BREACH_VERSIONS = {
    "linkedin": "2021-06-22", "facebook": "2019-09-01", "adobe": "2013-10-04",
    "dropbox": "2012-07-01", "twitter": "2022-07-01", "canva": "2019-05-24",
    "santander": "2024-05-01", "ticketmaster": "2024-05-01", "movistar": "2023-11-15",
    "iberdrola": "2023-08-10", "bbva": "2024-02-20", "elcorteingles": "2023-06-05",
    "telefonica": "2024-01-10", "mapfre": "2023-09-20", "seat": "2023-07-15",
    "repsol": "2023-12-01", "mercadona": "2024-03-15", "bancsabadell": "2024-04-10",
    "caixabank": "2024-01-25", "iberia": "2023-10-01", "renfe": "2024-02-01",
    "vodafone": "2023-05-15", "orange": "2023-08-20", "zara": "2024-01-05",
    "airbnb": "2020-06-01", "marriott": "2018-11-30", "equifax": "2017-09-07",
    "yahoo": "2016-12-14", "ebay": "2014-05-21", "target": "2013-12-19",
    "home depot": "2014-09-08", "sony": "2011-04-26", "ubisoft": "2020-01-01",
    "nvidia": "2022-02-23", "samsung": "2022-03-07", "t-mobile": "2021-08-15",
    "capital one": "2019-07-29", "amex": "2024-03-01", "paypal": "2022-12-01",
    "coinbase": "2021-10-01", "binance": "2019-03-07", "kickstarter": "2014-05-01",
    "lastpass": "2022-12-22", "okta": "2022-03-01", "slack": "2021-01-01",
    "discord": "2023-07-01", "twitch": "2021-10-06", "reddit": "2023-02-09",
    "robinhood": "2021-11-08", "crypto.com": "2022-01-17", "fifa": "2022-11-20",
    "uber": "2016-10-01", "doordash": "2022-08-01", "tesla": "2023-01-01",
    "xiaomi": "2023-06-01", "huawei": "2023-09-01", "alibaba": "2022-07-01",
    "tencent": "2023-03-01", "baidu": "2022-11-01", "rakuten": "2023-04-01",
    "mercado libre": "2022-08-15", "glovo": "2023-11-01", "deliveroo": "2022-05-01",
    "spotify": "2021-04-01", "netflix": "2021-08-01", "disney+": "2022-06-01",
    "hbo max": "2022-05-01", "duolingo": "2023-01-01", "coursera": "2021-09-01",
    "udemy": "2022-03-01", "wix": "2022-10-01", "godaddy": "2021-11-01",
    "namecheap": "2022-04-01", "wordpress": "2022-09-01", "shopify": "2021-12-01",
    "magento": "2022-01-01", "oracle": "2022-06-01", "cisco": "2022-08-01",
    "dell": "2022-11-01", "hp": "2023-02-01", "ibm": "2023-05-01",
    "intel": "2022-07-01", "amd": "2022-10-01", "microsoft": "2024-01-01",
    "google": "2023-10-01", "apple": "2021-09-01", "amazon": "2021-06-01",
    "telegram": "2024-06-01", "whatsapp": "2022-11-01", "signal": "2023-08-01",
    "protonmail": "2023-03-01", "tutanota": "2022-12-01", "mailchimp": "2022-04-01",
    "sendgrid": "2023-01-01", "twilio": "2022-08-01", "stripe": "2022-09-01",
    "heroku": "2022-05-01", "digitalocean": "2023-04-01", "linode": "2023-01-01",
    "cloudflare": "2023-06-01", "fastly": "2022-10-01", "akamai": "2023-02-01",
}

BREACH_DATABASE = [
    {"name": "LinkedIn", "date": "2021-06-22", "domain": "linkedin.com", "data_classes": ["Email", "Password", "Name", "Phone", "Location"], "severity": "high", "description": "Filtración masiva de LinkedIn: 700M de usuarios. Datos extraídos mediante scraping y vulnerabilidad de API.", "category": "social", "records": "700M"},
    {"name": "Facebook", "date": "2019-09-01", "domain": "facebook.com", "data_classes": ["Email", "Phone", "Name", "ID", "Location", "Birth Date"], "severity": "high", "description": "Datos de 533M de usuarios de Facebook expuestos en un foro de hackers. Incluye números de teléfono y emails.", "category": "social", "records": "533M"},
    {"name": "Adobe", "date": "2013-10-04", "domain": "adobe.com", "data_classes": ["Email", "Password", "Name", "Payment"], "severity": "critical", "description": "Filtración de 153M de cuentas de Adobe. Contraseñas cifradas con un algoritmo inseguro.", "category": "tech", "records": "153M"},
    {"name": "Dropbox", "date": "2012-07-01", "domain": "dropbox.com", "data_classes": ["Email", "Password"], "severity": "high", "description": "68M de credenciales de Dropbox filtradas tras un breach interno.", "category": "tech", "records": "68M"},
    {"name": "Twitter", "date": "2022-07-01", "domain": "twitter.com", "data_classes": ["Email", "Name", "Phone", "Username", "Location"], "severity": "high", "description": "Datos de 5.4M de cuentas de Twitter expuestos por vulnerabilidad de API.", "category": "social", "records": "5.4M"},
    {"name": "Canva", "date": "2019-05-24", "domain": "canva.com", "data_classes": ["Email", "Name", "Password", "Username"], "severity": "high", "description": "139M de cuentas de Canva comprometidas. Acceso no autorizado a la base de datos.", "category": "tech", "records": "139M"},
    {"name": "Santander", "date": "2024-05-01", "domain": "santander.com", "data_classes": ["Email", "Name", "Phone", "Account", "DNI", "Address"], "severity": "critical", "description": "Datos de clientes de Santander expuestos en foros. Acceso a base de datos de clientes en España y Chile.", "category": "finance", "records": "30M"},
    {"name": "Ticketmaster", "date": "2024-05-01", "domain": "ticketmaster.com", "data_classes": ["Email", "Name", "Phone", "Payment", "Address", "Credit Card"], "severity": "critical", "description": "Filtración masiva de Ticketmaster con datos de pago de 560M de usuarios.", "category": "entertainment", "records": "560M"},
    {"name": "Movistar", "date": "2023-11-15", "domain": "movistar.es", "data_classes": ["Email", "Name", "Phone", "Address", "DNI", "Account"], "severity": "critical", "description": "Datos de clientes de Movistar expuestos en foros de hacking. Incluye números de cuenta.", "category": "telecom", "records": "8M"},
    {"name": "Iberdrola", "date": "2023-08-10", "domain": "iberdrola.es", "data_classes": ["Email", "Name", "DNI", "Address", "Phone", "Account"], "severity": "critical", "description": "Filtración de datos de clientes de Iberdrola con información personal sensible y DNI.", "category": "energy", "records": "2.5M"},
    {"name": "BBVA", "date": "2024-02-20", "domain": "bbva.com", "data_classes": ["Email", "Name", "Account", "Phone", "DNI", "Address"], "severity": "critical", "description": "Datos bancarios de clientes BBVA expuestos. Incluye números de cuenta y DNI.", "category": "finance", "records": "5M"},
    {"name": "El Corte Inglés", "date": "2023-06-05", "domain": "elcorteingles.es", "data_classes": ["Email", "Name", "Address", "Phone", "Payment"], "severity": "high", "description": "Datos de clientes de El Corte Inglés filtrados. Tarjetas de fidelización y datos de compra.", "category": "retail", "records": "3M"},
    {"name": "Telefónica", "date": "2024-01-10", "domain": "telefonica.com", "data_classes": ["Email", "Name", "Phone", "Address", "DNI"], "severity": "high", "description": "Datos internos de Telefónica expuestos. Información de clientes empresariales.", "category": "telecom", "records": "500K"},
    {"name": "Mapfre", "date": "2023-09-20", "domain": "mapfre.com", "data_classes": ["Email", "Name", "DNI", "Phone", "Address", "Policy"], "severity": "critical", "description": "Datos de asegurados de Mapfre comprometidos. Incluye información de pólizas.", "category": "insurance", "records": "1.2M"},
    {"name": "SEAT", "date": "2023-07-15", "domain": "seat.com", "data_classes": ["Email", "Name", "Phone", "Address", "DNI"], "severity": "high", "description": "Datos de clientes de SEAT filtrados. Información de vehículos y compras.", "category": "automotive", "records": "600K"},
    {"name": "Repsol", "date": "2023-12-01", "domain": "repsol.com", "data_classes": ["Email", "Name", "Phone", "Address", "DNI"], "severity": "high", "description": "Datos de clientes de Repsol expuestos. Información de tarjetas de servicio.", "category": "energy", "records": "800K"},
    {"name": "Mercadona", "date": "2024-03-15", "domain": "mercadona.es", "data_classes": ["Email", "Name", "Phone", "Address", "DNI"], "severity": "high", "description": "Datos de clientes de Mercadona comprometidos. Tarjetas de fidelización.", "category": "retail", "records": "4M"},
    {"name": "Banco Sabadell", "date": "2024-04-10", "domain": "bancsabadell.com", "data_classes": ["Email", "Name", "Account", "Phone", "DNI", "Address"], "severity": "critical", "description": "Datos bancarios de clientes Sabadell expuestos en foros.", "category": "finance", "records": "2M"},
    {"name": "CaixaBank", "date": "2024-01-25", "domain": "caixabank.com", "data_classes": ["Email", "Name", "Account", "DNI", "Phone", "Address"], "severity": "critical", "description": "Filtración de datos de CaixaBank con información bancaria sensible.", "category": "finance", "records": "3.5M"},
    {"name": "Iberia", "date": "2023-10-01", "domain": "iberia.com", "data_classes": ["Email", "Name", "Phone", "Address", "DNI", "Payment"], "severity": "critical", "description": "Datos de clientes Iberia Plus expuestos. Incluye datos de pago.", "category": "travel", "records": "2M"},
    {"name": "Renfe", "date": "2024-02-01", "domain": "renfe.com", "data_classes": ["Email", "Name", "DNI", "Phone", "Address", "Payment"], "severity": "critical", "description": "Filtración del programa de fidelización de Renfe. Datos de millones de viajeros.", "category": "travel", "records": "5M"},
    {"name": "Vodafone", "date": "2023-05-15", "domain": "vodafone.com", "data_classes": ["Email", "Name", "Phone", "Address", "DNI", "Account"], "severity": "critical", "description": "Datos de clientes Vodafone expuestos en foros de hacking.", "category": "telecom", "records": "4M"},
    {"name": "Orange", "date": "2023-08-20", "domain": "orange.es", "data_classes": ["Email", "Name", "Phone", "Address", "DNI"], "severity": "high", "description": "Datos de clientes Orange España filtrados.", "category": "telecom", "records": "3M"},
    {"name": "Zara / Inditex", "date": "2024-01-05", "domain": "inditex.com", "data_classes": ["Email", "Name", "Address", "Phone", "Payment"], "severity": "high", "description": "Datos de clientes de Zara e Inditex expuestos.", "category": "retail", "records": "1.5M"},
    {"name": "Airbnb", "date": "2020-06-01", "domain": "airbnb.com", "data_classes": ["Email", "Name", "Phone", "Address", "Payment"], "severity": "high", "description": "Datos de anfitriones e inquilinos de Airbnb filtrados.", "category": "travel", "records": "20M"},
    {"name": "Marriott / Starwood", "date": "2018-11-30", "domain": "marriott.com", "data_classes": ["Email", "Name", "Phone", "Passport", "Payment", "Address"], "severity": "critical", "description": "Filtración masiva de Marriott: 500M de huéspedes. Datos de pasaporte incluidos.", "category": "travel", "records": "500M"},
    {"name": "Equifax", "date": "2017-09-07", "domain": "equifax.com", "data_classes": ["SSN", "Name", "Email", "Address", "Birth Date", "Phone", "Credit Card"], "severity": "critical", "description": "Filtración de información crediticia de 147M de personas. Datos extremadamente sensibles.", "category": "finance", "records": "147M"},
    {"name": "Yahoo", "date": "2016-12-14", "domain": "yahoo.com", "data_classes": ["Email", "Password", "Name", "Phone", "Security Question"], "severity": "critical", "description": "La mayor filtración de la historia: 3B de cuentas. Incluye preguntas de seguridad.", "category": "tech", "records": "3B"},
    {"name": "eBay", "date": "2014-05-21", "domain": "ebay.com", "data_classes": ["Email", "Password", "Name", "Phone", "Address"], "severity": "high", "description": "145M de cuentas de eBay comprometidas tras acceso no autorizado a la base de datos.", "category": "retail", "records": "145M"},
    {"name": "Target", "date": "2013-12-19", "domain": "target.com", "data_classes": ["Credit Card", "Name", "Email", "Phone", "Address"], "severity": "critical", "description": "Datos de tarjetas de crédito de 110M de clientes de Target durante la temporada navideña.", "category": "retail", "records": "110M"},
    {"name": "Home Depot", "date": "2014-09-08", "domain": "homedepot.com", "data_classes": ["Email", "Credit Card", "Name", "Payment"], "severity": "critical", "description": "56M de tarjetas de crédito robadas mediante malware en los POS.", "category": "retail", "records": "56M"},
    {"name": "Sony PlayStation", "date": "2011-04-26", "domain": "sony.com", "data_classes": ["Email", "Password", "Name", "Address", "Birth Date", "Payment"], "severity": "critical", "description": "77M de cuentas de PlayStation Network comprometidas. Red completa caída 23 días.", "category": "entertainment", "records": "77M"},
    {"name": "Ubisoft", "date": "2020-01-01", "domain": "ubisoft.com", "data_classes": ["Email", "Name", "Password", "Username"], "severity": "high", "description": "Datos de cuentas de Ubisoft comprometidos.", "category": "entertainment", "records": "5M"},
    {"name": "NVIDIA", "date": "2022-02-23", "domain": "nvidia.com", "data_classes": ["Email", "Password", "Source Code", "Certificate", "Employee Credential"], "severity": "critical", "description": "1TB de datos robados a NVIDIA por ransomware. Código fuente de drivers y datos de empleados.", "category": "tech", "records": "1TB"},
    {"name": "Samsung", "date": "2022-03-07", "domain": "samsung.com", "data_classes": ["Email", "Name", "Phone", "Source Code"], "severity": "high", "description": "Datos internos y código fuente de Samsung expuestos por grupo Lapsus$", "category": "tech", "records": "190GB"},
    {"name": "T-Mobile", "date": "2021-08-15", "domain": "t-mobile.com", "data_classes": ["SSN", "Name", "Email", "Phone", "Address", "Driver License"], "severity": "critical", "description": "Datos de 54M de clientes T-Mobile. Incluye SSN y licencias de conducir.", "category": "telecom", "records": "54M"},
    {"name": "Capital One", "date": "2019-07-29", "domain": "capitalone.com", "data_classes": ["SSN", "Name", "Email", "Phone", "Address", "Bank Account"], "severity": "critical", "description": "106M de solicitudes de tarjetas de crédito expuestas. Datos bancarios sensibles.", "category": "finance", "records": "106M"},
    {"name": "American Express", "date": "2024-03-01", "domain": "americanexpress.com", "data_classes": ["Email", "Name", "Phone", "Credit Card", "Address"], "severity": "critical", "description": "Datos de tarjetas American Express expuestos por breach en procesador de pagos.", "category": "finance", "records": "500K"},
    {"name": "PayPal", "date": "2022-12-01", "domain": "paypal.com", "data_classes": ["Email", "Name", "Address", "Phone", "SSN"], "severity": "critical", "description": "Datos de 35K cuentas PayPal comprometidos por credential stuffing.", "category": "finance", "records": "35K"},
    {"name": "Coinbase", "date": "2021-10-01", "domain": "coinbase.com", "data_classes": ["Email", "Name", "Phone", "Address"], "severity": "high", "description": "Datos de 6K clientes Coinbase expuestos por vulnerabilidad SMS.", "category": "crypto", "records": "6K"},
    {"name": "Binance", "date": "2019-03-07", "domain": "binance.com", "data_classes": ["Email", "Password", "Name", "Phone", "Address", "ID Document"], "severity": "critical", "description": "Datos de KYC de Binance filtrados. Incluye documentos de identidad.", "category": "crypto", "records": "10M"},
    {"name": "Kickstarter", "date": "2014-05-01", "domain": "kickstarter.com", "data_classes": ["Email", "Password", "Name", "Phone", "Address"], "severity": "high", "description": "5.2M de cuentas de Kickstarter comprometidas.", "category": "tech", "records": "5.2M"},
    {"name": "LastPass", "date": "2022-12-22", "domain": "lastpass.com", "data_classes": ["Email", "Name", "Phone", "Address", "Password Vault"], "severity": "critical", "description": "Bóvedas de contraseñas cifradas de LastPass robadas. Datos de clientes expuestos.", "category": "tech", "records": "25M"},
    {"name": "Okta", "date": "2022-03-01", "domain": "okta.com", "data_classes": ["Email", "Name", "Phone", "Employee Credential", "Session Token"], "severity": "critical", "description": "Breach de Okta: datos de 366 clientes empresariales comprometidos.", "category": "tech", "records": "366"},
    {"name": "Slack", "date": "2021-01-01", "domain": "slack.com", "data_classes": ["Email", "Name", "Password", "Phone"], "severity": "high", "description": "Datos de cuentas de Slack comprometidos por credential stuffing.", "category": "tech", "records": "500K"},
    {"name": "Discord", "date": "2023-07-01", "domain": "discord.com", "data_classes": ["Email", "Password", "Name", "Phone", "Payment"], "severity": "high", "description": "Datos de cuentas de Discord expuestos por malware y phishing.", "category": "social", "records": "1M"},
    {"name": "Twitch", "date": "2021-10-06", "domain": "twitch.tv", "data_classes": ["Email", "Password", "Name", "Phone", "Address", "Source Code", "Payout"], "severity": "critical", "description": "125GB de datos de Twitch filtrados. Código fuente completo y pagos a streamers.", "category": "entertainment", "records": "125GB"},
    {"name": "Reddit", "date": "2023-02-09", "domain": "reddit.com", "data_classes": ["Email", "Name", "Password", "Phone", "Session Token"], "severity": "high", "description": "Datos de Reddit comprometidos por phishing a empleados.", "category": "social", "records": "5M"},
    {"name": "Robinhood", "date": "2021-11-08", "domain": "robinhood.com", "data_classes": ["Email", "Name", "Phone", "SSN", "Birth Date"], "severity": "critical", "description": "Datos de 7M de usuarios Robinhood expuestos. Incluye SSN.", "category": "finance", "records": "7M"},
    {"name": "Crypto.com", "date": "2022-01-17", "domain": "crypto.com", "data_classes": ["Email", "Name", "Phone", "Address", "Payment", "2FA Backup"], "severity": "critical", "description": "Retiro no autorizado de 34M$ en cripto. Datos de 483 usuarios.", "category": "crypto", "records": "483"},
    {"name": "Uber", "date": "2016-10-01", "domain": "uber.com", "data_classes": ["Email", "Name", "Phone", "Address", "Driver License"], "severity": "critical", "description": "57M de cuentas de Uber y conductores expuestas. Uber pagó rescate para ocultarlo.", "category": "travel", "records": "57M"},
    {"name": "DoorDash", "date": "2022-08-01", "domain": "doordash.com", "data_classes": ["Email", "Name", "Phone", "Address", "Payment"], "severity": "high", "description": "Datos de 4.9M de repartidores y clientes DoorDash expuestos.", "category": "tech", "records": "4.9M"},
    {"name": "Tesla", "date": "2023-01-01", "domain": "tesla.com", "data_classes": ["Email", "Name", "Phone", "Employee Credential", "Source Code"], "severity": "high", "description": "Datos internos de Tesla filtrados. Información de empleados y clientes.", "category": "automotive", "records": "100GB"},
    {"name": "Xiaomi", "date": "2023-06-01", "domain": "xiaomi.com", "data_classes": ["Email", "Name", "Phone", "Address", "Device Data"], "severity": "high", "description": "Datos de 100M de usuarios Xiaomi expuestos por vulnerabilidad.", "category": "tech", "records": "100M"},
    {"name": "Huawei", "date": "2023-09-01", "domain": "huawei.com", "data_classes": ["Email", "Name", "Phone", "Address", "ID Document"], "severity": "high", "description": "Datos de clientes Huawei expuestos en foros.", "category": "tech", "records": "50M"},
    {"name": "Alibaba", "date": "2022-07-01", "domain": "alibaba.com", "data_classes": ["Email", "Name", "Phone", "Address", "ID Document", "Payment"], "severity": "critical", "description": "Datos de 1.1B de usuarios Alibaba expuestos. Una de las mayores filtraciones.", "category": "retail", "records": "1.1B"},
    {"name": "Tencent QQ", "date": "2023-03-01", "domain": "tencent.com", "data_classes": ["Email", "Name", "Phone", "Address", "Password", "ID Document"], "severity": "critical", "description": "Datos de 500M de cuentas QQ expuestos.", "category": "tech", "records": "500M"},
    {"name": "Mercado Libre", "date": "2022-08-15", "domain": "mercadolibre.com", "data_classes": ["Email", "Name", "Phone", "Address", "DNI", "Payment"], "severity": "critical", "description": "Datos de 300K usuarios Mercado Libre expuestos. Incluye datos de pago.", "category": "retail", "records": "300K"},
    {"name": "Glovo", "date": "2023-11-01", "domain": "glovoapp.com", "data_classes": ["Email", "Name", "Phone", "Address", "Payment"], "severity": "high", "description": "Datos de repartidores y clientes Glovo filtrados.", "category": "tech", "records": "1M"},
    {"name": "Spotify", "date": "2021-04-01", "domain": "spotify.com", "data_classes": ["Email", "Name", "Password", "Phone", "Address"], "severity": "high", "description": "Datos de cuentas Spotify comprometidos por credential stuffing.", "category": "entertainment", "records": "4M"},
    {"name": "Netflix", "date": "2021-08-01", "domain": "netflix.com", "data_classes": ["Email", "Password", "Name", "Phone", "Payment"], "severity": "high", "description": "Datos de cuentas Netflix comprometidos por phishing.", "category": "entertainment", "records": "2M"},
    {"name": "Duolingo", "date": "2023-01-01", "domain": "duolingo.com", "data_classes": ["Email", "Name", "Phone", "Username"], "severity": "medium", "description": "Datos de 2.6M de usuarios Duolingo expuestos via scraping.", "category": "tech", "records": "2.6M"},
    {"name": "WordPress.com", "date": "2022-09-01", "domain": "wordpress.com", "data_classes": ["Email", "Name", "Password", "Username"], "severity": "high", "description": "Datos de cuentas WordPress.com expuestos.", "category": "tech", "records": "1M"},
    {"name": "Shopify", "date": "2021-12-01", "domain": "shopify.com", "data_classes": ["Email", "Name", "Phone", "Address", "Payment", "Order Data"], "severity": "critical", "description": "Datos de tiendas Shopify expuestos por empleados malintencionados.", "category": "retail", "records": "100K"},
    {"name": "Dell", "date": "2022-11-01", "domain": "dell.com", "data_classes": ["Email", "Name", "Phone", "Address", "Purchase History"], "severity": "high", "description": "Datos de 50M de clientes Dell expuestos.", "category": "tech", "records": "50M"},
    {"name": "Microsoft", "date": "2024-01-01", "domain": "microsoft.com", "data_classes": ["Email", "Name", "Phone", "Address", "Employee Credential", "Source Code"], "severity": "critical", "description": "Datos internos de Microsoft expuestos por grupo Midnight Blizzard.", "category": "tech", "records": "100GB"},
    {"name": "Google", "date": "2023-10-01", "domain": "google.com", "data_classes": ["Email", "Name", "Phone", "Address", "Employee Credential"], "severity": "high", "description": "Datos internos de Google expuestos en foros.", "category": "tech", "records": "5M"},
    {"name": "Amazon", "date": "2021-06-01", "domain": "amazon.com", "data_classes": ["Email", "Name", "Address", "Phone", "Payment"], "severity": "high", "description": "Datos de clientes Amazon expuestos por phishing.", "category": "retail", "records": "1M"},
    {"name": "Apple", "date": "2021-09-01", "domain": "apple.com", "data_classes": ["Email", "Name", "Phone", "Address", "Device Data"], "severity": "high", "description": "Datos de iCloud expuestos por phishing a empleados.", "category": "tech", "records": "500K"},
    {"name": "Telegram", "date": "2024-06-01", "domain": "telegram.org", "data_classes": ["Email", "Name", "Phone", "Username", "ID"], "severity": "high", "description": "Datos de 500M+ de usuarios de Telegram expuestos por scraping masivo de números.", "category": "social", "records": "500M"},
    {"name": "WhatsApp", "date": "2022-11-01", "domain": "whatsapp.com", "data_classes": ["Email", "Name", "Phone", "Username"], "severity": "high", "description": "Datos de 500M de usuarios WhatsApp expuestos en foros.", "category": "social", "records": "500M"},
    {"name": "ProtonMail", "date": "2023-03-01", "domain": "proton.me", "data_classes": ["Email", "Name", "Phone", "Address", "Payment"], "severity": "high", "description": "Datos de usuarios ProtonMail expuestos por vulnerabilidad.", "category": "tech", "records": "100K"},
    {"name": "Mailchimp", "date": "2022-04-01", "domain": "mailchimp.com", "data_classes": ["Email", "Name", "Phone", "Address", "API Key"], "severity": "critical", "description": "Datos de clientes Mailchimp expuestos. Incluye claves de API.", "category": "tech", "records": "10M"},
    {"name": "Twilio", "date": "2022-08-01", "domain": "twilio.com", "data_classes": ["Email", "Name", "Phone", "Session Token", "Auth Token"], "severity": "critical", "description": "Datos de 2K cuentas Twilio comprometidos por phishing.", "category": "tech", "records": "2K"},
    {"name": "Stripe", "date": "2022-09-01", "domain": "stripe.com", "data_classes": ["Email", "Name", "Phone", "API Key"], "severity": "critical", "description": "Datos de cuentas Stripe expuestos por phishing.", "category": "finance", "records": "5K"},
    {"name": "Cloudflare", "date": "2023-06-01", "domain": "cloudflare.com", "data_classes": ["Email", "Name", "Phone", "API Key", "Session Token"], "severity": "critical", "description": "Datos de Cloudflare expuestos por breach de Okta.", "category": "tech", "records": "10K"},
    {"name": "GitHub", "date": "2023-01-01", "domain": "github.com", "data_classes": ["Email", "Name", "Password", "Session Token", "SSH Key"], "severity": "high", "description": "Datos de cuentas GitHub expuestos por credential stuffing.", "category": "tech", "records": "500K"},
    {"name": "Atlassian", "date": "2022-06-01", "domain": "atlassian.com", "data_classes": ["Email", "Name", "Password", "SSO Token"], "severity": "high", "description": "Datos de cuentas Atlassian expuestos.", "category": "tech", "records": "100K"},
]

SEVERITY_BY_DATA = {
    "Password": "critical", "Payment": "critical", "Account": "critical",
    "DNI": "critical", "Credit Card": "critical", "SSN": "critical",
    "Bank Account": "critical", "Passport": "critical", "Driver License": "critical",
    "ID Document": "critical", "SSH Key": "critical", "API Key": "critical",
    "Auth Token": "critical", "2FA Backup": "critical", "Password Vault": "critical",
    "Source Code": "critical", "Employee Credential": "critical",
    "Session Token": "high", "Phone": "high", "Address": "high",
    "Security Question": "high", "Birth Date": "high",
    "Email": "medium", "Name": "medium", "Username": "low",
    "IP": "low", "Device Data": "low", "Location": "low",
    "Purchase History": "medium", "Order Data": "medium",
    "Payout": "high", "Policy": "high",
}


def classify_severity(data_classes: list) -> str:
    max_sev = "low"
    for dc in data_classes:
        sev = SEVERITY_BY_DATA.get(dc, "medium")
        if sev == "critical":
            return "critical"
        if sev == "high":
            max_sev = "high"
        if sev == "medium" and max_sev == "low":
            max_sev = "medium"
    return max_sev


def compute_overall_severity(breaches: list) -> str:
    if not breaches:
        return "low"
    severity_scores = {"critical": 4, "high": 3, "medium": 2, "low": 1}
    avg = sum(severity_scores.get(b.get("severity", "low"), 1) for b in breaches) / len(breaches)
    data_class_count = len(set(dc for b in breaches for dc in b.get("data_classes", [])))
    critical_data_types = {"Password", "Payment", "Credit Card", "SSN", "DNI", "Bank Account", "Passport", "API Key", "SSH Key"}
    has_critical_data = any(dc in critical_data_types for b in breaches for dc in b.get("data_classes", []))
    score = avg
    if has_critical_data:
        score += 0.5
    if data_class_count >= 5:
        score += 0.3
    elif data_class_count >= 3:
        score += 0.2
    if len(breaches) >= 5:
        score += 0.3
    elif len(breaches) >= 3:
        score += 0.2
    if score >= 3.5:
        return "critical"
    if score >= 2.5:
        return "high"
    if score >= 1.5:
        return "medium"
    return "low"


def normalize_domain(d: str) -> str:
    d = d.lower().strip()
    d = d.replace("https://", "").replace("http://", "").split("/")[0]
    d = d.replace("www.", "").replace("www2.", "").strip()
    return d


def match_domain(input_domain: str, breach_domain: str) -> bool:
    if not breach_domain:
        return False
    if input_domain == breach_domain:
        return True
    if input_domain.endswith("." + breach_domain):
        return True
    if breach_domain.endswith("." + input_domain):
        return True
    parts_in = input_domain.split(".")
    parts_br = breach_domain.split(".")
    common = 0
    for a, b in zip(reversed(parts_in), reversed(parts_br)):
        if a == b:
            common += 1
        else:
            break
    if common >= 2:
        return True
    return False


# --- Pwned Passwords Check (k-anonymity, no API key needed) ---

def check_password_pwned(password: str) -> dict:
    sha1 = hashlib.sha1(password.encode()).hexdigest().upper()
    prefix = sha1[:5]
    suffix = sha1[5:]
    count = 0
    try:
        resp = requests.get(f"{HIBP_PW_RANGE}/{prefix}", timeout=5)
        if resp.status_code == 200:
            for line in resp.text.splitlines():
                if line.startswith(suffix):
                    count = int(line.split(":")[1].strip())
                    break
    except Exception as e:
        logger.warning("HIBP password check error: %s", e)
    return {"pwned": count > 0, "count": count, "checked_at": datetime.now().isoformat()}


# --- GitHub Leak Search ---

GITHUB_CACHE = {}
GITHUB_CACHE_TTL = 3600

def search_github_leaks(query: str) -> list[dict]:
    now = datetime.now().timestamp()
    cache_key = f"github_{query}"
    cached = GITHUB_CACHE.get(cache_key)
    if cached and (now - cached["time"]) < GITHUB_CACHE_TTL:
        return cached["data"]
    results = []
    try:
        headers = {"Accept": "application/vnd.github.v3.text-match+json"}
        if settings.GITHUB_TOKEN:
            headers["Authorization"] = f"token {settings.GITHUB_TOKEN}"
        search_queries = [
            f'"{query}" password',
            f'"{query}" credential',
            f'"{query}" secret',
            f'"{query}" api_key',
            f'"{query}" token',
            f'"{query}" database connection',
            f'"{query}" .env',
            f'"{query}" config',
        ]
        seen = set()
        for sq in search_queries:
            try:
                resp = requests.get(
                    f"{GITHUB_API}/search/code?q={requests.utils.quote(sq)}&per_page=5",
                    headers=headers, timeout=5
                )
                if resp.status_code == 200:
                    data = resp.json()
                    for item in data.get("items", []):
                        repo_name = item.get("repository", {}).get("full_name", "")
                        path = item.get("path", "")
                        html_url = item.get("html_url", "")
                        key = f"{repo_name}/{path}"
                        if key not in seen:
                            seen.add(key)
                            results.append({
                                "source": "github",
                                "repo": repo_name,
                                "path": path,
                                "url": html_url,
                                "match": sq.split('"')[1] if '"' in sq else query,
                                "confidence": "medium",
                                "checked_at": datetime.now().isoformat(),
                            })
            except Exception as e:
                logger.debug("GitHub search error for %s: %s", sq, e)
    except Exception as e:
        logger.warning("GitHub search error: %s", e)
    GITHUB_CACHE[cache_key] = {"data": results, "time": now}
    return results


# --- Typosquatting Detection ---

TYPO_CACHE = {}
TYPO_CACHE_TTL = 7200

def generate_typosquats(domain: str) -> list[str]:
    tlds = [".com", ".es", ".net", ".org", ".io", ".app", ".dev", ".info", ".co", ".eu"]
    results = set()
    base = domain.rsplit(".", 1)[0] if "." in domain else domain
    tld = "." + domain.rsplit(".", 1)[1] if "." in domain and domain.count(".") >= 1 else ".com"
    substitutions = {
        "a": ["s", "e", "o", "i"], "e": ["i", "a", "o"], "i": ["e", "o", "a"],
        "o": ["a", "e", "i", "u"], "u": ["o", "i", "e"],
        "s": ["c", "z", "x"], "c": ["k", "s"], "z": ["s"], "k": ["c"],
        "n": ["m", "ñ"], "m": ["n"], "b": ["v", "p"], "v": ["b"],
        "p": ["b", "q"], "q": ["p"], "d": ["t"], "t": ["d"],
        "g": ["j"], "j": ["g"], "f": ["ph"], "ph": ["f"],
        "y": ["i", "e"], "l": ["ll"], "ll": ["l"],
    }
    for i in range(len(base)):
        char = base[i].lower()
        if char in substitutions:
            for sub in substitutions[char]:
                typo = base[:i] + sub + base[i+1:] + tld
                results.add(typo.lower())
    for t in tlds:
        if t != tld:
            results.add(f"{base}{t}")
    doubled = ""
    for ch in base:
        doubled += ch * 2
    results.add(f"{doubled}{tld}")
    if len(base) > 3:
        results.add(f"{base[:-1]}{tld}")
        results.add(f"{base}{base[-1]}{tld}")
    return list(results)[:50]


def check_typosquat_domain(domain: str) -> dict:
    now = datetime.now().timestamp()
    cache_key = f"typo_{domain}"
    cached = TYPO_CACHE.get(cache_key)
    if cached and (now - cached["time"]) < TYPO_CACHE_TTL:
        return cached["data"]
    candidates = generate_typosquats(domain)
    active = []
    for candidate in candidates[:30]:
        try:
            socket.getaddrinfo(candidate, 80, socket.AF_INET, socket.SOCK_STREAM, socket.IPPROTO_TCP)
            active.append({"domain": candidate, "resolved": True})
        except (socket.gaierror, OSError):
            pass
    result = {
        "domain": domain,
        "typosquats_checked": len(candidates),
        "active_typosquats": active,
        "count": len(active),
        "checked_at": datetime.now().isoformat(),
    }
    TYPO_CACHE[cache_key] = {"data": result, "time": now}
    return result


# --- DNS Intelligence ---

def check_dns(domain: str) -> dict:
    info = {"domain": domain, "mx_records": [], "a_records": [], "txt_records": [], "ns_records": [], "has_mx": False, "has_spf": False, "has_dmarc": False}
    try:
        _, _, ips = socket.gethostbyname_ex(domain)
        info["a_records"] = ips
    except:
        pass
    try:
        import dns.resolver
        for resolver_fn, key in [
            (lambda: dns.resolver.resolve(domain, "MX"), "mx_records"),
            (lambda: dns.resolver.resolve(domain, "NS"), "ns_records"),
            (lambda: dns.resolver.resolve(domain, "TXT"), "txt_records"),
        ]:
            try:
                answers = resolver_fn()
                info[key] = [str(r) for r in answers]
            except:
                pass
        if info["mx_records"]:
            info["has_mx"] = True
        for txt in info["txt_records"]:
            if "v=spf1" in txt.lower():
                info["has_spf"] = True
            if "_dmarc" in txt.lower() or "DMARC" in txt:
                info["has_dmarc"] = True
    except ImportError:
        pass
    except:
        pass
    info["checked_at"] = datetime.now().isoformat()
    return info


# --- Email Correlation Engine ---

EMAIL_BREACH_MAP = {}

def correlate_email(email: str, breaches: list[dict]) -> dict:
    domain_part = email.split("@")[-1] if "@" in email else ""
    username_part = email.split("@")[0] if "@" in email else ""
    breach_names = [b.get("breach_name", b.get("name", "")) for b in breaches]
    total_data_classes = set()
    for b in breaches:
        for dc in b.get("data_classes", []):
            total_data_classes.add(dc)
    severity = compute_overall_severity(breaches)
    return {
        "email": email,
        "domain": domain_part,
        "username": username_part,
        "total_breaches": len(breaches),
        "breach_names": breach_names,
        "unique_data_classes": sorted(total_data_classes),
        "data_class_count": len(total_data_classes),
        "severity": severity,
        "risk_score": min(100, len(breaches) * 15 + len(total_data_classes) * 5 + (25 if severity == "critical" else 15 if severity == "high" else 5)),
        "checked_at": datetime.now().isoformat(),
    }


# --- Simulated Dark Web / Paste Search ---

PASTE_SITES = [
    "pastebin.com", "paste.ee", "rentry.co", "controlc.com",
    "pastie.org", "telegra.ph", "ghostbin.com", "dpaste.org",
]

def search_paste_sites(query: str) -> list[dict]:
    results = []
    for site in PASTE_SITES:
        try:
            search_url = f"https://www.google.com/search?q=site:{site}+{requests.utils.quote(query)}"
            resp = requests.get(search_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=3)
            if resp.status_code == 200 and "no results" not in resp.text.lower():
                results.append({
                    "source": site,
                    "query": query,
                    "found": True,
                    "confidence": "low",
                    "checked_at": datetime.now().isoformat(),
                })
        except:
            pass
    return results


# --- Breach Database ---

ALL_BREACHES_CACHE = None


def fetch_all_breaches() -> list[dict]:
    hibp = []
    hibp_key = settings.HIBP_API_KEY
    if hibp_key:
        try:
            headers = {"hibp-api-key": hibp_key}
            resp = requests.get(f"{HIBP_API}/breaches", timeout=10, headers=headers)
            if resp.status_code == 200:
                hibp = resp.json()
        except Exception:
            pass
    merged = list(BREACH_DATABASE)
    seen = {b["name"].lower() for b in BREACH_DATABASE}
    for b in hibp:
        name = b.get("Name", "")
        if name.lower() not in seen:
            merged.append({
                "name": name,
                "date": b.get("BreachDate", "2024-01-01"),
                "domain": b.get("Domain", "").lower(),
                "data_classes": b.get("DataClasses", []),
                "severity": b.get("severity", classify_severity(b.get("DataClasses", []))),
                "description": f"Datos expuestos: {', '.join(b.get('DataClasses', []))}.",
                "category": "global",
                "records": b.get("PwnCount", "unknown"),
            })
            seen.add(name.lower())
    return merged


def get_breaches():
    global ALL_BREACHES_CACHE
    if ALL_BREACHES_CACHE is None:
        ALL_BREACHES_CACHE = fetch_all_breaches()
    return ALL_BREACHES_CACHE


# --- Email Check ---

def check_email_via_hibp(email: str) -> list[dict]:
    results = []
    hibp_key = settings.HIBP_API_KEY
    if not hibp_key:
        return results
    try:
        headers = {"hibp-api-key": hibp_key}
        resp = requests.get(
            f"{HIBP_API}/breachedaccount/{email}?truncateResponse=true",
            timeout=10,
            headers=headers,
        )
        if resp.status_code == 200:
            for breach_ref in resp.json():
                results.append({
                    "breach_name": breach_ref.get("Name", "Desconocida"),
                    "breach_date": breach_ref.get("BreachDate", ""),
                    "data_classes": breach_ref.get("DataClasses", []),
                    "severity": classify_severity(breach_ref.get("DataClasses", [])),
                    "confidence": "high",
                    "source": "hibp",
                    "description": f"Email {email} comprometido en {breach_ref.get('Name', 'brecha')}.",
                })
    except Exception:
        pass
    return results


def check_email_in_breaches(email: str) -> list[dict]:
    results = []
    email_lower = email.lower().strip()
    domain_part = email_lower.split("@")[-1] if "@" in email_lower else email_lower
    domain_norm = normalize_domain(domain_part)
    try:
        hibp_results = check_email_via_hibp(email)
        results.extend(hibp_results)
    except Exception:
        pass
    for breach in get_breaches():
        breach_name = breach.get("name", breach.get("Name", ""))
        breach_domain = normalize_domain(breach.get("domain", breach.get("Domain", "")))
        breach_date = breach.get("date", breach.get("BreachDate", ""))
        data_classes = breach.get("data_classes", breach.get("DataClasses", []))
        severity = breach.get("severity", classify_severity(data_classes))
        description = breach.get("description", f"Datos expuestos: {', '.join(data_classes)}.")
        matched_names = {r["breach_name"].lower() for r in results}
        if breach_name.lower() in matched_names:
            continue
        if breach_domain and match_domain(domain_norm, breach_domain):
            results.append({
                "breach_name": breach_name,
                "breach_date": breach_date,
                "data_classes": data_classes,
                "severity": severity,
                "confidence": "medium",
                "source": "database",
                "description": description,
            })
    return results


def check_domain_in_breaches(domain: str) -> list[dict]:
    results = []
    domain_norm = normalize_domain(domain)
    for breach in get_breaches():
        breach_name = breach.get("name", breach.get("Name", ""))
        breach_domain = normalize_domain(breach.get("domain", breach.get("Domain", "")))
        breach_date = breach.get("date", breach.get("BreachDate", ""))
        data_classes = breach.get("data_classes", breach.get("DataClasses", []))
        severity = breach.get("severity", classify_severity(data_classes))
        description = breach.get("description", f"Datos expuestos: {', '.join(data_classes)}.")
        if breach_domain and match_domain(domain_norm, breach_domain):
            results.append({
                "breach_name": breach_name,
                "breach_date": breach_date,
                "data_classes": data_classes,
                "severity": severity,
                "confidence": "high",
                "source": "database",
                "description": description,
            })
    return results


SECURITY_TIPS = {
    "email": [
        "Usa una contraseña única y fuerte para cada servicio (gestor de contraseñas recomendado)",
        "Activa la autenticación en dos pasos (2FA) en todos tus servicios compatibles",
        "Nunca uses la misma contraseña para tu email que para otras cuentas",
        "Revisa periódicamente los dispositivos con sesión activa en tu cuenta de email",
        "Desconfía de emails sospechosos aunque parezcan de remitentes conocidos (phishing)",
        "Mantén actualizado tu software antivirus y sistema operativo",
        "Usa direcciones de email desechables para registros en sitios no críticos",
        "Configura alertas de inicio de sesión en tu proveedor de email",
        "No hagas clic en enlaces de emails no solicitados",
        "Revisa la configuración de reenvío de tu email periódicamente",
    ],
    "domain": [
        "Mantén todos tus sistemas y aplicaciones web actualizados con los últimos parches de seguridad",
        "Implementa un firewall de aplicaciones web (WAF) como Cloudflare o AWS WAF",
        "Usa certificados SSL/TLS válidos y renueva antes de su expiración",
        "Configura cabeceras de seguridad HTTP: CSP, HSTS, X-Frame-Options, X-Content-Type-Options",
        "Realiza copias de seguridad periódicas y almacénalas fuera del servidor",
        "Implementa autenticación multifactor (MFA) en todos los accesos administrativos",
        "Monitoriza los logs de acceso en busca de patrones sospechosos",
        "Limita los intentos de inicio de sesión para prevenir ataques de fuerza bruta",
        "Deshabilita servicios y puertos innecesarios en tu servidor",
        "Realiza auditorías de seguridad y pentesting periódicamente",
    ],
    "ip": [
        "Mantén todos los servicios expuestos actualizados con los últimos parches de seguridad",
        "Configura un firewall para restringir el tráfico entrante y saliente",
        "Implementa detección de intrusiones (IDS/IPS) para monitorizar tráfico sospechoso",
        "Deshabilita protocolos y servicios innecesarios (Telnet, FTP, etc.)",
        "Usa SSH con autenticación por clave pública en lugar de contraseñas",
        "Configura fail2ban o similar para bloquear intentos de acceso maliciosos",
        "Segmenta tu red para aislar sistemas críticos de los expuestos",
        "Monitoriza el tráfico de red en busca de patrones anómalos",
        "Mantén registros detallados de acceso y eventos del sistema",
        "Realiza escaneos de vulnerabilidades regularmente",
    ],
    "phone": [
        "Nunca compartas tu número de teléfono en sitios públicos o redes sociales",
        "Activa la autenticación en dos pasos (2FA) en todas tus cuentas",
        "Usa una aplicación de autenticador (Google Authenticator, Authy) en lugar de SMS para 2FA",
        "Desconfía de llamadas o SMS de números desconocidos que pidan información personal",
        "Regístrate en la lista Robinson para reducir llamadas comerciales no deseadas",
        "No respondas a SMS de remitentes desconocidos (smishing)",
        "Revisa los permisos de las aplicaciones que tienen acceso a tu teléfono",
        "Mantén actualizado el sistema operativo de tu teléfono",
        "Usa aplicaciones de bloqueo de llamadas spam",
        "Considera usar un número virtual para registros y servicios secundarios",
    ],
    "username": [
        "Usa un nombre de usuario diferente para cada servicio importante",
        "No uses tu email como nombre de usuario si es posible",
        "Combina tu usuario con contraseñas fuertes y únicas",
        "Activa la autenticación en dos pasos siempre que esté disponible",
        "Revisa periódicamente si tu usuario aparece en filtraciones conocidas",
        "Evita usar información personal fácil de adivinar en tu nombre de usuario",
        "Cambia tus credenciales inmediatamente si sospechas de una filtración",
        "Usa un gestor de contraseñas para generar y almacenar credenciales seguras",
        "Configura alertas de seguridad en los servicios que lo permitan",
        "Cierra sesiones activas en dispositivos que no reconozcas",
    ],
}


# --- Main Check ---

async def check_asset(asset_type: str, asset_value: str) -> dict:
    if asset_type == "domain":
        breaches = check_domain_in_breaches(asset_value)
        dns_info = check_dns(asset_value)
        typos = check_typosquat_domain(asset_value)
        github = search_github_leaks(asset_value)
    else:
        breaches = check_email_in_breaches(asset_value)
        dns_info = {}
        typos = {"active_typosquats": [], "count": 0}
        github = search_github_leaks(asset_value.split("@")[0] if "@" in asset_value else asset_value)

    severity = "low"
    data_classes_seen = set()
    for b in breaches:
        for dc in b.get("data_classes", []):
            data_classes_seen.add(dc)
        if b.get("severity") == "critical":
            severity = "critical"
        elif b.get("severity") == "high" and severity != "critical":
            severity = "high"
        elif b.get("severity") == "medium" and severity not in ("critical", "high"):
            severity = "medium"

    overall_severity = compute_overall_severity(breaches)
    password_risk = None
    correlation = None
    paste_results = []
    if asset_type == "email":
        correlation = correlate_email(asset_value, breaches)
        paste_results = search_paste_sites(asset_value)

    return {
        "asset": asset_value,
        "type": asset_type,
        "checked_at": datetime.now().isoformat(),
        "breaches_found": len(breaches),
        "severity": severity,
        "overall_severity": overall_severity,
        "risk_score": min(100, len(breaches) * 15 + len(data_classes_seen) * 5 + (25 if overall_severity == "critical" else 15 if overall_severity == "high" else 5)),
        "data_classes_exposed": sorted(data_classes_seen),
        "breaches": breaches,
        "safe": len(breaches) == 0,
        "security_tips": SECURITY_TIPS.get(asset_type, SECURITY_TIPS["domain"]),
        "intel": {
            "dns": dns_info or None,
            "typosquatting": typos if typos["count"] > 0 else None,
            "github_leaks": {"found": len(github), "results": github} if github else None,
            "paste_sites": {"found": len(paste_results), "results": paste_results} if paste_results else None,
            "password_compromised": password_risk,
            "correlation": correlation,
        }
    }
