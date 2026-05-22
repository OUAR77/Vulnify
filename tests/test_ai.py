from unittest.mock import patch, MagicMock
from modules.ai import analyze_report, check_duplicate, chat, enhance_report, suggest_poc


MOCK_ANALYZE_JSON = '{"severity": "high", "cwe_id": "CWE-79", "cvss_score": 7.5, "cvss_vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:L", "confidence": 0.85, "explanation": "XSS vulnerability"}'
MOCK_DUP_JSON = '{"is_duplicate": false, "similarity": 0.15, "reason": "Different vulnerability types"}'
MOCK_CHAT_RESPONSE = "This is a security analysis response"
MOCK_ENHANCE_RESPONSE = "Corregido texto técnico."
MOCK_POC_RESPONSE = "1. Use Burp Suite\n2. Intercept request\n3. Inject payload"


def _mock_ai_response(text: str):
    mock = MagicMock()
    mock.choices = [MagicMock()]
    mock.choices[0].message.content = text
    return mock


@patch("modules.ai.client")
def test_analyze_report(mock_client):
    mock_client.chat.completions.create.return_value = _mock_ai_response(MOCK_ANALYZE_JSON)
    result = analyze_report("XSS", "Vuln description", "Step 1", "Data leak")
    assert result is not None
    assert result["severity"] == "high"
    assert result["cwe_id"] == "CWE-79"


@patch("modules.ai.client")
def test_check_duplicate(mock_client):
    mock_client.chat.completions.create.return_value = _mock_ai_response(MOCK_DUP_JSON)
    result = check_duplicate("New bug", "Desc", "Old bug", "Old desc")
    assert result is not None
    assert result["is_duplicate"] is False


@patch("modules.ai.client")
def test_ai_chat(mock_client):
    mock_client.chat.completions.create.return_value = _mock_ai_response(MOCK_CHAT_RESPONSE)
    result = chat([{"role": "user", "content": "How to test XSS?"}])
    assert result == MOCK_CHAT_RESPONSE


@patch("modules.ai.client")
def test_enhance_report(mock_client):
    mock_client.chat.completions.create.return_value = _mock_ai_response(MOCK_ENHANCE_RESPONSE)
    result = enhance_report("Texto con errores.", "grammar")
    assert result == MOCK_ENHANCE_RESPONSE


@patch("modules.ai.client")
def test_suggest_poc(mock_client):
    mock_client.chat.completions.create.return_value = _mock_ai_response(MOCK_POC_RESPONSE)
    result = suggest_poc("SQL injection in login", "SQLi")
    assert result == MOCK_POC_RESPONSE


@patch("modules.ai.client", None)
def test_analyze_report_no_client():
    result = analyze_report("XSS", "Desc", "", "")
    assert result is None


@patch("modules.ai.client", None)
def test_chat_no_client():
    result = chat([{"role": "user", "content": "hi"}])
    assert result is None
