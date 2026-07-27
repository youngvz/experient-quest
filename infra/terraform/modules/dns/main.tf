// Route53 A-record for the multiplayer server. Off by default so the
// first apply can succeed without a hosted zone; flip create_dns=true
// once you own a domain in this account.

resource "aws_route53_record" "server" {
  count = var.create_dns ? 1 : 0

  zone_id = var.hosted_zone_id
  name    = var.hostname
  type    = "A"
  ttl     = 60
  records = [var.ip_address]
}
