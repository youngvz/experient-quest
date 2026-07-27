provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project   = "experient-quest"
      Component = "mmo-server"
      ManagedBy = "terraform"
    }
  }
}

module "network" {
  source = "./modules/network"

  my_ip = var.my_ip
}

module "compute" {
  source = "./modules/compute"

  instance_type     = var.instance_type
  key_name          = var.key_name
  subnet_id         = module.network.subnet_id
  security_group_id = module.network.security_group_id
  repo_url          = var.repo_url
  mmo_hostname      = var.mmo_hostname
  create_eip        = var.create_eip
}

module "dns" {
  source = "./modules/dns"

  create_dns     = var.create_dns
  hosted_zone_id = var.hosted_zone_id
  hostname       = var.mmo_hostname
  ip_address     = module.compute.public_ip
}
