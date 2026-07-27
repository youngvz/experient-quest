output "fqdn" {
  value       = var.create_dns ? aws_route53_record.server[0].fqdn : null
  description = "Fully qualified hostname of the created A-record, or null when create_dns=false."
}
