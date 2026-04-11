import re
from dataclasses import dataclass, field
from typing import Optional

def scrub_pii(user_query: str) -> str:
    """Removes sensitive data before AI sees it (Layer 1)."""
    user_query = re.sub(r'\b(?:\d[ -]*?){13,16}\b', '[REDACTED_CARD]', user_query)
    user_query = re.sub(r'\b\d{10}\b', '[REDACTED_PHONE]', user_query)
    user_query = re.sub(r'\S+@\S+', '[REDACTED_EMAIL]', user_query)
    return user_query

@dataclass
class ValidationResult:
    """Structured result — carry this through your pipeline instead of just bool."""
    is_valid: bool
    layer: Optional[str] = None
    reason: Optional[str] = None
    severity: Optional[str] = None  # "critical" | "warn"

    def __bool__(self):
        return self.is_valid

    def __repr__(self):
        if self.is_valid:
            return "ValidationResult(✅ PASS)"
        return f"ValidationResult(❌ {self.severity.upper()} | {self.layer} | {self.reason})"


@dataclass
class SQLValidatorConfig:
    """Swap this out per-use-case — no code changes needed."""
    allowed_tables: list[str] = field(default_factory=lambda: ["TRANSACTIONS"])
    allowed_statement_types: tuple[str, ...] = ("SELECT", "WITH")
    forbidden_keywords: list[str] = field(default_factory=lambda: [
        "DROP", "DELETE", "UPDATE", "INSERT", "ALTER",
        "TRUNCATE", "REPLACE", "MERGE", "EXEC", "CALL",
        "GRANT", "REVOKE", "CREATE",
    ])
    require_from_clause: bool = True
    max_length: int = 8000  # Guard against absurdly long payloads


# ── Default config (module-level singleton) ────────────────────────────────────
_DEFAULT_CONFIG = SQLValidatorConfig()


def validate_sql(sql_query: str, config: SQLValidatorConfig = _DEFAULT_CONFIG) -> ValidationResult:
    """
    Five-layer read-only SQL validator.

    Returns a ValidationResult — truthy on pass, falsy on fail with context.
    Pass a custom SQLValidatorConfig to override tables, keywords, or limits.
    """

    # ── Layer 1: Input sanitization ────────────────────────────────────────────
    if not sql_query or not isinstance(sql_query, str):
        return ValidationResult(False, "input_sanitization", "Empty or non-string input", "critical")

    sql = sql_query.strip()

    if len(sql) > config.max_length:
        return ValidationResult(False, "input_sanitization",
                                f"Query exceeds max length ({config.max_length} chars)", "critical")

    sql_upper = sql.upper()

    # ── Layer 2: Statement type ────────────────────────────────────────────────
    if not any(sql_upper.startswith(t) for t in config.allowed_statement_types):
        allowed = " / ".join(config.allowed_statement_types)
        return ValidationResult(False, "statement_type",
                                f"Only {allowed} statements allowed", "critical")

    # ── Layer 3: Destructive keyword blocklist ─────────────────────────────────
    # Strip comments first so we don't miss keywords hidden inside them
    sql_stripped = re.sub(r'--[^\n]*', '', sql_upper)        # line comments
    sql_stripped = re.sub(r'/\*.*?\*/', '', sql_stripped, flags=re.DOTALL)  # block comments

    for kw in config.forbidden_keywords:
        if re.search(rf"\b{re.escape(kw)}\b", sql_stripped):
            return ValidationResult(False, "destructive_keywords",
                                    f"Forbidden keyword detected: {kw}", "critical")

    # ── Layer 4: Injection pattern detection ──────────────────────────────────
    # Multi-statement execution (allow single trailing semicolon)
    if sql.rstrip(";").count(";") > 0:
        return ValidationResult(False, "injection_patterns",
                                "Multiple SQL statements detected", "critical")

    # Comment-based injection: comment appearing after a string literal or mid-clause
    # e.g.  ' OR 1=1 --   or   '; DROP TABLE --
    if re.search(r"'[^']*--", sql) or re.search(r";\s*--", sql):
        return ValidationResult(False, "injection_patterns",
                                "Suspicious comment after string/statement", "critical")

    # Stacked block comment injection: '/* or */'
    if re.search(r"'/\*|'\*/", sql):
        return ValidationResult(False, "injection_patterns",
                                "Block comment adjacent to string literal", "critical")

    # Classic tautology patterns  (1=1, 'a'='a', etc.)
    if re.search(r"\b(OR|AND)\s+['\d]+\s*=\s*['\d]+", sql_upper):
        return ValidationResult(False, "injection_patterns",
                                "Tautology pattern detected", "warn")

    # ── Layer 5: Schema enforcement ────────────────────────────────────────────
    if config.allowed_tables:
        if not any(tbl.upper() in sql_upper for tbl in config.allowed_tables):
            listed = ", ".join(config.allowed_tables)
            return ValidationResult(False, "schema_enforcement",
                                    f"Query must reference one of: {listed}", "warn")

    if config.require_from_clause and "FROM" not in sql_upper:
        return ValidationResult(False, "schema_enforcement",
                                "Missing FROM clause", "warn")

    return ValidationResult(True)