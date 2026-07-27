// Reads the account's default VPC and its public subnets; creates one
// security group that fronts the game server. No new VPC / IGW / route
// tables are created - we're piggybacking on default networking to
// keep the blast radius tiny for a 50-CCU MVP.

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default_public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }

  filter {
    name   = "default-for-az"
    values = ["true"]
  }
}

resource "aws_security_group" "server" {
  name        = "experient-mmo-server"
  description = "Ingress for the Experient Quest multiplayer server (WSS/HTTP/SSH)."
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "WSS (Caddy terminates TLS, reverse-proxies to Node)."
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP for the ACME challenge Caddy runs on first cert issuance."
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Direct Node port for IP-only smoke testing before DNS + Caddy are live."
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH - locked to the operator current /32."
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_ip]
  }

  egress {
    description = "Unrestricted outbound (docker pulls, apt updates, LE ACME requests)."
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "experient-mmo-server"
  }
}
