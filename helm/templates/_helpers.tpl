{{- define "amuzing-subs-calendar.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "amuzing-subs-calendar.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{- define "amuzing-subs-calendar.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" -}}
{{- end -}}

{{- define "amuzing-subs-calendar.labels" -}}
app.kubernetes.io/name: {{ include "amuzing-subs-calendar.name" . }}
helm.sh/chart: {{ include "amuzing-subs-calendar.chart" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "amuzing-subs-calendar.selectorLabels" -}}
app.kubernetes.io/name: {{ include "amuzing-subs-calendar.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}
