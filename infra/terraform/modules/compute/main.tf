// EC2 + Elastic IP + IAM instance profile for the multiplayer server.
// user_data runs the repo's bootstrap script; changing the template
// does NOT force a replace (see lifecycle block), so config changes
// ship via `make deploy-server` rather than tearing down the box.

data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

// IAM: read-only SSM (for parameter store fetches later) + CloudWatch
// Logs write (for the log agent, if we bolt it on).
data "aws_iam_policy_document" "assume" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "server" {
  name               = "experient-mmo-server"
  assume_role_policy = data.aws_iam_policy_document.assume.json
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.server.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "cw_logs" {
  role       = aws_iam_role.server.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_instance_profile" "server" {
  name = "experient-mmo-server"
  role = aws_iam_role.server.name
}

resource "aws_instance" "server" {
  ami                    = data.aws_ami.al2023.id
  instance_type          = var.instance_type
  key_name               = var.key_name
  subnet_id              = var.subnet_id
  vpc_security_group_ids = [var.security_group_id]
  iam_instance_profile   = aws_iam_instance_profile.server.name

  user_data = templatefile("${path.module}/../../user-data/cloud-init.sh", {
    repo_url     = var.repo_url
    mmo_hostname = var.mmo_hostname
  })

  // Don't replace the instance every time user-data changes — we want
  // config changes to flow through `make deploy-server`, not through
  // Terraform destroying and re-creating the EC2.
  user_data_replace_on_change = false

  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
  }

  metadata_options {
    http_tokens = "required"
  }

  tags = {
    Name = "experient-mmo-server"
  }
}

resource "aws_eip" "server" {
  count  = var.create_eip ? 1 : 0
  domain = "vpc"

  tags = {
    Name = "experient-mmo-server"
  }
}

resource "aws_eip_association" "server" {
  count         = var.create_eip ? 1 : 0
  instance_id   = aws_instance.server.id
  allocation_id = aws_eip.server[0].id
}
