output "instance_id" {
  description = "EC2 instance id — the Makefile looks this up by Name tag, but the id is useful for aws ec2 CLI one-offs."
  value       = module.compute.instance_id
}

output "public_ip" {
  description = "Elastic IP attached to the server. Point your Route53 A-record here."
  value       = module.compute.public_ip
}

output "public_dns" {
  description = "AWS-assigned public DNS (ec2-....compute.amazonaws.com). Fine for ad-hoc SSH before a real hostname exists."
  value       = module.compute.public_dns
}

output "wss_url_hint" {
  description = "Convenience: the URL clients should connect to once DNS + Caddy are up. IP-only phase falls back to ws://<public_ip>:8080."
  value       = var.create_dns ? "wss://${var.mmo_hostname}/game" : "ws://${module.compute.public_ip}:8080"
}
