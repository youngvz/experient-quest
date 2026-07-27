# Repo-root Makefile — wraps every AWS + Terraform lifecycle operation
# so day-to-day work doesn't need long CLI incantations. Local dev of
# the server (docker build / run / logs) lives in `server/Makefile`.
#
# Prerequisites:
#   - AWS CLI configured (`aws sts get-caller-identity` works)
#   - Terraform ≥ 1.7 on PATH
#   - An EC2 key pair created once via the console; its name in tfvars
#
# Common flows:
#   make tf-bootstrap-init tf-bootstrap-apply   # ONE time per account
#   make tf-init tf-apply                       # provision the server
#   make start                                  # boot for a demo
#   make ssh / make logs                        # inspect
#   make stop                                   # $0 compute again

REGION      ?= us-east-1
EC2_NAME    ?= experient-mmo-server
KEY_PATH    ?= $(HOME)/.ssh/experient-mmo.pem
TF_DIR      := infra/terraform
TF_BOOTSTRAP:= infra/terraform/bootstrap

# Resolve the EC2 instance id by Name tag. Empty string when the tag
# doesn't resolve (nothing provisioned yet) — the recipes that need it
# guard against that.
EC2_ID = $(shell aws ec2 describe-instances \
	--region $(REGION) \
	--filters "Name=tag:Name,Values=$(EC2_NAME)" \
	          "Name=instance-state-name,Values=pending,running,stopping,stopped" \
	--query 'Reservations[0].Instances[0].InstanceId' \
	--output text 2>/dev/null)

.PHONY: help \
        tf-bootstrap-init tf-bootstrap-apply tf-bootstrap-destroy \
        tf-init tf-plan tf-apply tf-destroy tf-fmt tf-validate \
        start stop status ssh logs \
        deploy-server \
        require-ec2

help:
	@echo "Terraform:"
	@echo "  tf-bootstrap-init    Init the state-bucket bootstrap workspace"
	@echo "  tf-bootstrap-apply   Create S3 state bucket + DynamoDB lock table (one-time)"
	@echo "  tf-init              Init the main workspace (uses the S3 backend)"
	@echo "  tf-plan              Preview changes"
	@echo "  tf-apply             Apply changes"
	@echo "  tf-fmt / tf-validate Formatting + validation"
	@echo "  tf-destroy           Tear down all server infra"
	@echo ""
	@echo "Server lifecycle:"
	@echo "  start                aws ec2 start-instances (blocks until running)"
	@echo "  stop                 aws ec2 stop-instances"
	@echo "  status               Show EC2 state + public IP"
	@echo "  ssh                  SSH into the box (KEY_PATH=$(KEY_PATH))"
	@echo "  logs                 Tail docker compose logs over SSH"
	@echo "  deploy-server        git pull + docker compose up -d --build on the box"

# ---- Terraform: bootstrap (state bucket + lock table) ---------------------

tf-bootstrap-init:
	cd $(TF_BOOTSTRAP) && terraform init

tf-bootstrap-apply:
	cd $(TF_BOOTSTRAP) && terraform apply

tf-bootstrap-destroy:
	cd $(TF_BOOTSTRAP) && terraform destroy

# ---- Terraform: main workspace --------------------------------------------

tf-init:
	cd $(TF_DIR) && terraform init

tf-plan:
	cd $(TF_DIR) && terraform plan

tf-apply:
	cd $(TF_DIR) && terraform apply

tf-destroy:
	cd $(TF_DIR) && terraform destroy

tf-fmt:
	terraform fmt -recursive $(TF_DIR)

tf-validate:
	cd $(TF_DIR) && terraform validate

# ---- EC2 lifecycle --------------------------------------------------------

require-ec2:
	@if [ -z "$(EC2_ID)" ] || [ "$(EC2_ID)" = "None" ]; then \
		echo "ERROR: no EC2 tagged Name=$(EC2_NAME) found in $(REGION). Run 'make tf-apply' first."; \
		exit 1; \
	fi

start: require-ec2
	aws ec2 start-instances --region $(REGION) --instance-ids $(EC2_ID)
	aws ec2 wait instance-running --region $(REGION) --instance-ids $(EC2_ID)
	@echo "Server running. Public IP: $$(aws ec2 describe-instances \
		--region $(REGION) --instance-ids $(EC2_ID) \
		--query 'Reservations[0].Instances[0].PublicIpAddress' --output text)"

stop: require-ec2
	aws ec2 stop-instances --region $(REGION) --instance-ids $(EC2_ID)

status: require-ec2
	aws ec2 describe-instances --region $(REGION) --instance-ids $(EC2_ID) \
		--query 'Reservations[0].Instances[0].[State.Name,PublicIpAddress,LaunchTime]' \
		--output table

ssh: require-ec2
	ssh -i $(KEY_PATH) ec2-user@$$(aws ec2 describe-instances \
		--region $(REGION) --instance-ids $(EC2_ID) \
		--query 'Reservations[0].Instances[0].PublicDnsName' --output text)

logs: require-ec2
	ssh -i $(KEY_PATH) ec2-user@$$(aws ec2 describe-instances \
		--region $(REGION) --instance-ids $(EC2_ID) \
		--query 'Reservations[0].Instances[0].PublicDnsName' --output text) \
		"cd /opt/experient-quest/server && sudo docker compose logs -f --tail=200"

deploy-server: require-ec2
	ssh -i $(KEY_PATH) ec2-user@$$(aws ec2 describe-instances \
		--region $(REGION) --instance-ids $(EC2_ID) \
		--query 'Reservations[0].Instances[0].PublicDnsName' --output text) \
		"cd /opt/experient-quest && git pull --ff-only && cd server && sudo docker compose up -d --build"
