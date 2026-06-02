import pytest
from modules.intel import (
    classify_severity,
    normalize_domain,
    match_domain,
    check_domain_in_breaches,
    check_email_in_breaches,
)


def test_classify_severity():
    assert classify_severity(["Password"]) == "critical"
    assert classify_severity(["Email"]) == "medium"
    assert classify_severity(["Name"]) == "medium"
    assert classify_severity(["Username"]) == "low"
    assert classify_severity(["Phone"]) == "high"


def test_normalize_domain():
    assert normalize_domain("https://www.example.com") == "example.com"
    assert normalize_domain("HTTP://Example.COM/") == "example.com"
    assert normalize_domain("www2.test.org") == "test.org"


def test_match_domain():
    assert match_domain("example.com", "example.com") == True
    assert match_domain("sub.example.com", "example.com") == True
    assert match_domain("example.com", "sub.example.com") == True
    assert match_domain("other.com", "example.com") == False


def test_check_domain_linkedin():
    results = check_domain_in_breaches("linkedin.com")
    assert len(results) > 0
    assert any("LinkedIn" in r["breach_name"] for r in results)


def test_check_domain_santander():
    results = check_domain_in_breaches("santander.com")
    assert len(results) > 0
    assert any(r["severity"] == "critical" for r in results)


def test_check_domain_unknown():
    results = check_domain_in_breaches("nonexistent-test-domain-xyz123.com")
    assert len(results) == 0


def test_check_email_in_breaches():
    results = check_email_in_breaches("test@gmail.com")
    assert isinstance(results, list)


def test_check_asset_domain():
    import asyncio
    from modules.intel import check_asset
    result = asyncio.run(check_asset("domain", "linkedin.com"))
    assert result["breaches_found"] > 0
    assert result["asset"] == "linkedin.com"
