variable "create_dns" {
  description = "Whether to actually create the A-record."
  type        = bool
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone id. Ignored when create_dns=false."
  type        = string
}

variable "hostname" {
  description = "Full hostname for the A-record (e.g. mmo.example.com)."
  type        = string
}

variable "ip_address" {
  description = "Elastic IP the A-record points at."
  type        = string
}
