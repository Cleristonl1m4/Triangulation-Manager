from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.date import DateTrigger
from datetime import datetime, timedelta, timezone

scheduler = BackgroundScheduler()
scheduler.start()

JOB_ID = "triangulacao_auto_disable"
_activation_time: datetime | None = None


def schedule_auto_disable(delay_seconds: int, on_expire) -> None:
    global _activation_time
    unschedule_auto_disable()
    _activation_time = datetime.now(timezone.utc)
    run_at = _activation_time + timedelta(seconds=delay_seconds)
    scheduler.add_job(
        on_expire,
        trigger=DateTrigger(run_date=run_at),
        id=JOB_ID,
        replace_existing=True,
    )


def unschedule_auto_disable() -> None:
    global _activation_time
    if scheduler.get_job(JOB_ID):
        scheduler.remove_job(JOB_ID)
    _activation_time = None


def remaining_seconds(total_seconds: int) -> int:
    if _activation_time is None or not scheduler.get_job(JOB_ID):
        return 0
    elapsed = (datetime.now(timezone.utc) - _activation_time).total_seconds()
    left = total_seconds - int(elapsed)
    return max(left, 0)
