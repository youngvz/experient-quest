output "vpc_id" {
  value       = data.aws_vpc.default.id
  description = "Default VPC id (informational)."
}

output "subnet_id" {
  // Pick the first public default-for-az subnet. Availability is fine
  // for a single EC2; multi-AZ isn't in scope for 50 CCU.
  value       = data.aws_subnets.default_public.ids[0]
  description = "Public subnet the EC2 launches into."
}

output "security_group_id" {
  value       = aws_security_group.server.id
  description = "Security group id attached to the EC2."
}
