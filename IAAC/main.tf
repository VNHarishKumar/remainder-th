provider "aws" {
  region  = "us-east-1"
  profile = "demo" # Replace with your AWS profile name
}

# Create VPC
resource "aws_vpc" "my_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "remainder_vpc"
  }
}

# Create Internet Gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.my_vpc.id

  tags = {
    Name = "remainder_igw"
  }
}

# Create Public Subnet 1 (us-east-1a)
resource "aws_subnet" "public_subnet1" {
  vpc_id                  = aws_vpc.my_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true

  tags = {
    Name = "public_subnet1"
  }
}

# Create Public Subnet 2 (us-east-1b)
resource "aws_subnet" "public_subnet2" {
  vpc_id                  = aws_vpc.my_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = "us-east-1b"
  map_public_ip_on_launch = true

  tags = {
    Name = "public_subnet2"
  }
}

# Create Private Subnet (us-east-1a)
resource "aws_subnet" "private_subnet" {
  vpc_id            = aws_vpc.my_vpc.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name = "private_subnet"
  }
}

# Create Route Table for Public Subnets
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.my_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "public_rt"
  }
}

# Associate Route Table with Public Subnets
resource "aws_route_table_association" "public_rt_assoc1" {
  subnet_id      = aws_subnet.public_subnet1.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "public_rt_assoc2" {
  subnet_id      = aws_subnet.public_subnet2.id
  route_table_id = aws_route_table.public_rt.id
}

# Create Route Table for Private Subnet
resource "aws_route_table" "private_rt" {
  vpc_id = aws_vpc.my_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_gw.id
  }

  tags = {
    Name = "private_rt"
  }
}

# Associate Route Table with Private Subnet
resource "aws_route_table_association" "private_rt_assoc" {
  subnet_id      = aws_subnet.private_subnet.id
  route_table_id = aws_route_table.private_rt.id
}

# Create NAT Gateway
resource "aws_eip" "nat_eip" {
  # vpc = true
  domain = "vpc"
}

resource "aws_nat_gateway" "nat_gw" {
  allocation_id = aws_eip.nat_eip.id
  subnet_id     = aws_subnet.public_subnet1.id

  tags = {
    Name = "nat_gateway"
  }
}

# Create Security Group
resource "aws_security_group" "remainder_security_group" {
  vpc_id = aws_vpc.my_vpc.id
  name   = "remainder_security_group"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "remainder_security_group"
  }
}

# Create Key Pair
resource "aws_key_pair" "remainder_key" {
  key_name   = "remainder_key"
 public_key = "ur public key can also use a pem file"
 }

# Create IAM Role for EC2
resource "aws_iam_role" "ec2_role" {
  name = "ec2_role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
}

# Policy for S3 Access
resource "aws_iam_policy" "s3_access_policy" {
  name        = "ec2_s3_access_policy"
  description = "Allow EC2 instances to access S3 bucket"

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "s3:*",
            "Resource": [
                "arn:aws:s3:::remainder-app-th",
                "arn:aws:s3:::remainder-app-th/*"
            ]
        }
    ]
}
EOF
}

# Attach S3 Policy to IAM Role
resource "aws_iam_role_policy_attachment" "ec2_role_policy_attach" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.s3_access_policy.arn
}

# Policy for SNS Access
resource "aws_iam_policy" "sns_publish_policy" {
  name        = "ec2_sns_publish_policy"
  description = "Allow EC2 instances to publish to SNS topics"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = "sns:Publish",
        Resource = "arn:aws:sns:us-east-1:924858102654:remainder"
      }
    ]
  })
}

# Attach SNS Policy to IAM Role
resource "aws_iam_role_policy_attachment" "ec2_sns_policy_attach" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.sns_publish_policy.arn
}

# Create IAM Instance Profile
resource "aws_iam_instance_profile" "ec2_instance_profile" {
  name = "ec2_instance_profile"
  role = aws_iam_role.ec2_role.name
}

# Create EC2 Instance
resource "aws_instance" "remainder_ec2" {
  ami           = "ami-06d842b237423cea0" # Choose an appropriate AMI ID for your region That is my custom AMI id
  instance_type = "t2.micro"
  subnet_id     = aws_subnet.private_subnet.id
  key_name      = aws_key_pair.remainder_key.key_name

  vpc_security_group_ids = [aws_security_group.remainder_security_group.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_instance_profile.name

  tags = {
    Name = "remainder-ec2"
  }

  user_data = <<-EOF
                  #!/bin/bash
                  echo "Starting Django server..."
                  cd /home/ec2-user/remainder/backend
                  source venv/bin/activate
                  nohup python manage.py runserver 0.0.0.0:8000 &
                  echo "Django server started."
              EOF
}

# Create S3 Bucket for Static Website
resource "aws_s3_bucket" "remainder_app_bucket" {
  bucket        = "remainder-app-th"
  force_destroy = true

  tags = {
    Name = "remainder-app-th"
  }
}

# Configure S3 Bucket for Static Website Hosting
resource "aws_s3_bucket_website_configuration" "remainder_app_bucket_website" {
  bucket = aws_s3_bucket.remainder_app_bucket.bucket

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# Set Public Access Block Configuration
resource "aws_s3_bucket_public_access_block" "remainder_app_bucket_public_access" {
  bucket = aws_s3_bucket.remainder_app_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Set Bucket Policy for Public Access
resource "aws_s3_bucket_policy" "remainder_app_bucket_policy" {
  bucket = aws_s3_bucket.remainder_app_bucket.id

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Id": "Policy1721148573700",
    "Statement": [
        {
            "Sid": "Stmt1721148571820",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::remainder-app-th/*"
        }
    ]
}
EOF
}

resource "aws_lb" "remainder_alb" {
  name               = "remainder-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.remainder_security_group.id]
  subnets            = [aws_subnet.public_subnet1.id, aws_subnet.public_subnet2.id]

  tags = {
    Name = "remainder-alb"
  }
}

resource "aws_lb_target_group" "remainder_target_group" {
  name        = "remainder-target-group"
  port        = 8000 # Assuming your Django server runs on port 8000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.my_vpc.id
  target_type = "instance"

  health_check {
    path                = "/"
    port                = "8000"
    protocol            = "HTTP"
    interval            = 30
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
  }

  tags = {
    Name = "remainder-target-group"
  }
}

resource "aws_lb_listener" "http_listener" {
  load_balancer_arn = aws_lb.remainder_alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.remainder_target_group.arn
  }
}

# Create an HTTPS Listener for ALB
resource "aws_lb_listener" "https_listener" {
  load_balancer_arn = aws_lb.remainder_alb.arn
  port              = 443
  protocol          = "HTTPS"

  ssl_policy      = "ELBSecurityPolicy-2016-08"
  certificate_arn = "Ur certiciate arn" # Replace with your ACM certificate ARN

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.remainder_target_group.arn
  }
}

resource "aws_lb_target_group_attachment" "ec2_target_attachment" {
  target_group_arn = aws_lb_target_group.remainder_target_group.arn
  target_id        = aws_instance.remainder_ec2.id
  port             = 8000
}

# Hosted Zone ID for your domain (replace with your actual hosted zone ID)
variable "hosted_zone_id" {
  default = "Ur hosted zone id" # Replace with your hosted zone ID
}

# Create an A Record in Route 53 pointing to the ALB
resource "aws_route53_record" "subdomain_a_record" {
  zone_id = var.hosted_zone_id
  name    = "" # Create the record demo.example.com
  type    = "A"
  alias {
    name                   = aws_lb.remainder_alb.dns_name
    zone_id                = aws_lb.remainder_alb.zone_id
    evaluate_target_health = true
  }
}
