output "instance_id" {
  value       = aws_instance.server.id
  description = "EC2 instance id."
}

output "public_ip" {
  value       = var.create_eip ? aws_eip.server[0].public_ip : aws_instance.server.public_ip
  description = "Public IP. Stable Elastic IP when create_eip=true; ephemeral auto-assigned IP otherwise."
}

output "public_dns" {
  value       = aws_instance.server.public_dns
  description = "AWS-assigned DNS name."
}
