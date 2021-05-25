# xDD API Profiler for ADEPT
This is a simple tool for profiling xDD API performance in the context of the
ADEPT project.  It will scan and scroll through all of the metadata for the
NGDS-sourced documents within xDD, timing how long it takes to do so.

## Assumptions
```
python3
requests
```

## Usage

`python profile_api.py`

## Example output
Running on April 20, 2021:
```
Scrolled through 20973 documents in 0:00:56.293681 (374.51785714285717 per second).
```

