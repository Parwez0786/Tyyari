#!/bin/bash
set -euo pipefail

BROKER="${KAFKA_BROKERS:-kafka:29092}"

create_topic() {
  /opt/kafka/bin/kafka-topics.sh \
    --bootstrap-server "$BROKER" \
    --create \
    --if-not-exists \
    --topic "$1" \
    --partitions 3 \
    --replication-factor 1
}

create_topic "user-events"
create_topic "user-events.DLT"
create_topic "content-events"
create_topic "audit-events"

echo "Kafka topics ready."
