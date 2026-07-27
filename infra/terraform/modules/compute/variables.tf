variable "instance_type" {
  description = "EC2 instance size."
  type        = string
}

variable "key_name" {
  description = "Existing EC2 key pair name for SSH."
  type        = string
}

variable "subnet_id" {
  description = "Subnet the EC2 launches into."
  type        = string
}

variable "security_group_id" {
  description = "Security group attached to the EC2."
  type        = string
}

variable "repo_url" {
  description = "Git repo cloned by cloud-init."
  type        = string
}

variable "mmo_hostname" {
  description = "Hostname Caddy will terminate TLS on (passed into cloud-init as an env var)."
  type        = string
}

variable "create_eip" {
  description = "Whether to allocate an Elastic IP + association. When false, the EC2's auto-assigned public IP is used and public_ip output falls back to it."
  type        = bool
}
