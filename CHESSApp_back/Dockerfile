# ---- Base Image ----
FROM debian:bookworm

RUN apt-get update && apt-get install -y wget gnupg lsb-release

#######

# Fetch the MySQL GPG key from a keyserver
RUN gpg --batch --keyserver keyserver.ubuntu.com --recv-keys B7B3B788A8D3785C \
 && gpg --export B7B3B788A8D3785C > /usr/share/keyrings/mysql-archive-keyring.gpg

# Add the MySQL apt repository referencing that key
RUN echo "deb [signed-by=/usr/share/keyrings/mysql-archive-keyring.gpg] https://repo.mysql.com/apt/debian/ $(lsb_release -sc) mysql-8.0" \
    > /etc/apt/sources.list.d/mysql.list

# ---- System dependencies ----
RUN apt-get update && apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev \
    mysql-client \
    build-essential \
    python3 python3-pip python3-venv \
    && rm -rf /var/lib/apt/lists/*

# ---- Virtual environment ----
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# ---- Working directory ----
WORKDIR /app

# ---- Install Python dependencies ----
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt

# ---- Copy application code ----
COPY . .

# ---- Expose Flask ports ----
EXPOSE 5000
EXPOSE 5001
