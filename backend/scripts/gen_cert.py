"""Generate a self-signed TLS cert + key for local LAN/phone HTTPS.

Defaults produce `backend/certs/dev-cert.pem` and `backend/certs/dev-key.pem`
covering 192.168.0.166, localhost, and 127.0.0.1 in the SAN list — exactly
what the FastAPI server and the Vite dev server need for the cross-machine
demo. Re-run with --ip to add additional IPs to the SAN.

Usage:
    python scripts/gen_cert.py
    python scripts/gen_cert.py --ip 192.168.1.42

The phone will show a "not private" warning the first time you load each
URL — that's expected for self-signed certs. Tap "Advanced" -> "Proceed".
"""
import argparse
import ipaddress
import socket
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID


def detect_lan_ip() -> str | None:
    """Best-effort LAN IP detection. Opens a UDP socket to a public address
    (no packet is sent) so the OS picks the outbound interface; returns its
    address. Falls back to None if anything goes wrong."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except OSError:
        return None


def parse_args() -> argparse.Namespace:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--ip",
        action="append",
        default=[],
        help="Extra IPv4 address to include in the SAN. Repeatable.",
    )
    ap.add_argument(
        "--out-dir",
        default=str(Path(__file__).resolve().parent.parent / "certs"),
        help="Directory to write dev-cert.pem and dev-key.pem into.",
    )
    ap.add_argument(
        "--days",
        type=int,
        default=825,
        help="Validity in days (default 825 — the iOS-acceptable maximum).",
    )
    return ap.parse_args()


def main() -> int:
    args = parse_args()
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    cert_path = out_dir / "dev-cert.pem"
    key_path = out_dir / "dev-key.pem"

    detected = detect_lan_ip()
    default_ips = ["127.0.0.1"] + ([detected] if detected else [])
    ips = list(dict.fromkeys(default_ips + args.ip))

    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COMMON_NAME, "VentureLab Dev"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "VentureLab"),
    ])

    san = x509.SubjectAlternativeName([
        x509.DNSName("localhost"),
        *[x509.IPAddress(ipaddress.IPv4Address(ip)) for ip in ips],
    ])

    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(datetime.now(timezone.utc) - timedelta(minutes=1))
        .not_valid_after(datetime.now(timezone.utc) + timedelta(days=args.days))
        .add_extension(san, critical=False)
        .add_extension(x509.BasicConstraints(ca=True, path_length=None), critical=True)
        .sign(private_key=key, algorithm=hashes.SHA256())
    )

    cert_path.write_bytes(cert.public_bytes(serialization.Encoding.PEM))
    key_path.write_bytes(key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption(),
    ))

    print(f"  cert -> {cert_path}")
    print(f"  key  -> {key_path}")
    print(f"  SAN: DNS:localhost, IPs: {', '.join(ips)}")
    print(f"  valid until: {cert.not_valid_after_utc.isoformat()}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
