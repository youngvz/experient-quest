variable "region" {
  description = "AWS region to deploy the multiplayer server into."
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance size. t3.small fits ≤50 CCU comfortably; t3.micro works if you need pure free-tier."
  type        = string
  default     = "t3.small"
}

variable "key_name" {
  description = "Name of an existing EC2 key pair (created via `aws ec2 create-key-pair` or the console) used for SSH. Never stored in state."
  type        = string
}

variable "my_ip" {
  description = "Your public IP as a /32 CIDR — restricts SSH access. Get it with `curl ifconfig.me` then append /32."
  type        = string

  validation {
    condition     = can(regex("^[0-9.]+/32$", var.my_ip))
    error_message = "my_ip must be a /32 CIDR, e.g. \"1.2.3.4/32\"."
  }
}

variable "repo_url" {
  description = "HTTPS git URL cloned by cloud-init at first boot. Public repo → no auth needed."
  type        = string
  default     = "https://github.com/youngvz/experient-quest.git"
}

variable "mmo_hostname" {
  description = "Hostname Caddy terminates TLS on. Ignored until create_dns=true and the A-record resolves. Leave as \"mmo.example.com\" during the IP-only phase; Caddy will just fail cert issuance and you'll hit the EIP directly instead."
  type        = string
  default     = "mmo.example.com"
}

variable "create_dns" {
  description = "Whether to create the Route53 A-record. Leave false until you own a hosted zone in this account; flip to true and set hosted_zone_id + mmo_hostname when you do."
  type        = bool
  default     = false
}

variable "create_eip" {
  description = "Whether to allocate an Elastic IP. When false, the EC2's auto-assigned public IP is used (changes on every stop/start). Skip this when the account has hit its EIP quota; request a quota bump before enabling."
  type        = bool
  default     = true
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone id (Z...) for mmo_hostname. Only used when create_dns=true."
  type        = string
  default     = ""
}
